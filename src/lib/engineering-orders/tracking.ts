import crypto from "node:crypto";

const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TRACKING_LINK_TTL_SECONDS = 30 * 24 * 60 * 60;

function getTrackingSigningSecret(): string {
  const secret =
    process.env.ASSESSMENT_TRACKING_SECRET ||
    process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error(
      "Assessment tracking signing secret is not configured.",
    );
  }

  return secret;
}

function signTrackingPayload(
  orderId: string,
  expiresAt: number,
): string {
  return crypto
    .createHmac("sha256", getTrackingSigningSecret())
    .update(`${orderId}.${expiresAt}`, "utf8")
    .digest("base64url");
}

export function createTrackingToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashTrackingToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

export function isValidTrackingToken(token: string): boolean {
  return (
    typeof token === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(token)
  );
}

export function createSignedAssessmentTrackingLink(
  orderId: string,
): string {
  if (!ORDER_ID_PATTERN.test(orderId)) {
    throw new Error("Invalid assessment order ID.");
  }

  const expiresAt =
    Math.floor(Date.now() / 1000) + TRACKING_LINK_TTL_SECONDS;

  const signature = signTrackingPayload(orderId, expiresAt);

  return (
    `/engineering-assessment/track?orderId=${encodeURIComponent(orderId)}` +
    `&expires=${expiresAt}&sig=${encodeURIComponent(signature)}`
  );
}

export function isValidSignedAssessmentTrackingLink(
  orderId: string,
  expiresValue: string,
  signature: string,
): boolean {
  if (
    !ORDER_ID_PATTERN.test(orderId) ||
    !/^[0-9]{10}$/.test(expiresValue) ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature)
  ) {
    return false;
  }

  const expiresAt = Number(expiresValue);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + TRACKING_LINK_TTL_SECONDS
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(
      signTrackingPayload(orderId, expiresAt),
      "utf8",
    );
    const supplied = Buffer.from(signature, "utf8");

    return (
      expected.length === supplied.length &&
      crypto.timingSafeEqual(expected, supplied)
    );
  } catch {
    return false;
  }
}
