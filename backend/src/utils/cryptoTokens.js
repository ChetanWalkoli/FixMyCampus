import crypto from "node:crypto";

/**
 * Generate a cryptographically secure random token (hex string).
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

/**
 * Hash a raw token using SHA-256 before storing or querying in MongoDB.
 */
export const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(String(rawToken)).digest("hex");
};
