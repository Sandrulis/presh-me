import type { SocialPlatform } from "@/app/lib/types";

export function safeHref(raw: string, platform: SocialPlatform | "link" = "link") {
  const value = raw.trim();
  if (!value) return null;

  if (platform === "email" || value.toLowerCase().startsWith("mailto:")) {
    const email = value.replace(/^mailto:/i, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return `mailto:${email}`;
  }

  if (platform === "phone" || value.toLowerCase().startsWith("tel:")) {
    const phone = value.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
    if (phone.length < 6) return null;
    return `tel:${phone}`;
  }

  if (platform === "whatsapp" && !/^https?:\/\//i.test(value) && !value.includes("wa.me")) {
    const phone = value.replace(/[^\d]/g, "");
    if (phone.length >= 8) return `https://wa.me/${phone}`;
  }

  if (/^(javascript|data|vbscript):/i.test(value)) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Derīga http(s) saite linku blokam (tā pati loģika kā publiskajā lapā). */
export function isValidLinkUrl(raw: string): boolean {
  return safeHref(raw, "link") !== null;
}

/** Normalizē uz http(s) URL vai atgriež null. */
export function normalizeLinkUrl(raw: string): string | null {
  return safeHref(raw, "link");
}
