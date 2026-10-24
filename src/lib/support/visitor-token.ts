import "server-only";

import crypto from "node:crypto";

/**
 * Creates a high-entropy credential for one support conversation.
 * Return the raw token only to the visitor-facing server flow.
 */
export function createSupportVisitorToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Store this hash in Supabase, never the raw visitor credential.
 */
export function hashSupportVisitorToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * A 32-byte base64url token is exactly 43 characters.
 */
export function isValidSupportVisitorToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}
