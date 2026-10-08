import crypto from "node:crypto";

export const ENERGY_SESSION_COOKIE =
  "samiz_energy_session";

export const ENERGY_SESSION_TTL_SECONDS =
  60 * 60 * 24 * 30;

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(
  token: string,
): string {
  return crypto
    .createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}
