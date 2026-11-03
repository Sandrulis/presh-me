import { createHash, randomBytes } from "crypto";

export function createDeletionConfirmToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = hashDeletionConfirmToken(raw);
  return { raw, hash };
}

export function hashDeletionConfirmToken(raw: string): string {
  return createHash("sha256").update(raw.trim()).digest("hex");
}
