import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "samiz_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

const PASSWORD_HASH_ENV = "SAMIZ_ADMIN_PASSWORD_HASH";
const SESSION_SECRET_ENV = "SAMIZ_ADMIN_SESSION_SECRET";

type AdminSessionPayload = {
  sub: "admin";
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env[SESSION_SECRET_ENV];

  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error("Admin session secret is missing or invalid.");
  }

  return secret;
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  return (
    aBuffer.length === bBuffer.length &&
    crypto.timingSafeEqual(aBuffer, bBuffer)
  );
}

export function verifyAdminPassword(password: string): boolean {
  const stored = process.env[PASSWORD_HASH_ENV];

  if (!stored || password.length === 0) {
    return false;
  }

  const parts = stored.split(/[:$]/);

  if (
    parts.length !== 3 ||
    parts[0] !== "scrypt" ||
    !/^[a-f0-9]{32}$/i.test(parts[1]) ||
    !/^[a-f0-9]{128}$/i.test(parts[2])
  ) {
    throw new Error("Admin password hash is missing or invalid.");
  }

  const expected = Buffer.from(parts[2], "hex");
  const actual = crypto.scryptSync(password, parts[1], 64);

  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}

function signPayload(payload: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload, "utf8")
    .digest("base64url");
}

export function createAdminSessionToken(): string {
  const payload: AdminSessionPayload = {
    sub: "admin",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyAdminSessionToken(
  token: string,
): boolean {
  try {
    const parts = token.split(".");

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return false;
    }

    const expectedSignature = signPayload(parts[0]);

    if (!safeEqual(parts[1], expectedSignature)) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    return (
      payload.sub === "admin" &&
      Number.isSafeInteger(payload.exp) &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function setAdminSessionCookie(
  token: string,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return token ? verifyAdminSessionToken(token) : false;
}