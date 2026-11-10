import { instagramName } from "@/app/lib/source-preview";

export function instagramProfileName(value: string) {
  return instagramName(value);
}

export function instagramPostEmbedUrl(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  const code = match?.[1] ?? (/^[A-Za-z0-9_-]{5,}$/.test(trimmed) ? trimmed : null);
  if (!code) return null;
  return `https://www.instagram.com/p/${encodeURIComponent(code)}/embed`;
}

const X_RESERVED = new Set([
  "home",
  "search",
  "explore",
  "i",
  "intent",
  "share",
  "settings",
  "messages",
  "notifications",
  "compose",
]);

export function xHandle(value: string) {
  const text = value.trim().replace(/^@/, "");
  if (!text || /\/status\/\d+/.test(text)) return null;
  const fromUrl = text.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})(?:[/?#]|$)/i);
  const name = fromUrl?.[1] ?? text.split(/[/?#]/)[0] ?? "";
  if (!/^[A-Za-z0-9_]{1,15}$/.test(name)) return null;
  if (X_RESERVED.has(name.toLowerCase())) return null;
  return name;
}

export function xStatusUrl(value: string) {
  const text = value.replace(/&amp;/g, "&");
  const match = text.match(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/i);
  if (!match) return null;
  return `https://x.com/${match[1]}/status/${match[2]}`;
}

export function xPostCount(value: number) {
  if (!Number.isFinite(value)) return 5;
  return Math.min(20, Math.max(1, Math.round(value)));
}
