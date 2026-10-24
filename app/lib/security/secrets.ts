import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function keyBytes(): Buffer | null {
  const raw = process.env.INTEGRATION_SECRETS_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw).digest();
}

/** Encrypt at rest. If no key configured, returns plaintext (dev). */
export function encryptSecret(plain: string): string {
  const value = plain.trim();
  if (!value) return "";
  if (value.startsWith(PREFIX)) return value;
  const key = keyBytes();
  if (!key) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(stored: string): string {
  const value = stored.trim();
  if (!value.startsWith(PREFIX)) return value;
  const key = keyBytes();
  if (!key) throw new Error("INTEGRATION_SECRETS_KEY required to decrypt secret");
  const body = value.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted secret");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function secretLooksSet(stored: string | null | undefined): boolean {
  return Boolean(stored?.trim());
}
