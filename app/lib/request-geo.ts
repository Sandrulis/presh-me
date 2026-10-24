/** Best-effort client IP + country from proxy / CDN headers. */

const PRIVATE_IP =
  /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|fc|fd|fe80)/i;

export function clientIpFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim(),
  ];
  for (const value of candidates) {
    const ip = value?.trim() ?? "";
    if (ip && !PRIVATE_IP.test(ip)) return ip;
  }
  for (const value of candidates) {
    const ip = value?.trim() ?? "";
    if (ip) return ip;
  }
  return null;
}

export function countryCodeFromHeaders(headers: Headers): string | null {
  const raw =
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("x-country-code") ||
    "";
  const code = raw.trim().toUpperCase();
  if (!code || code === "XX" || code === "T1" || code.length !== 2) return null;
  return code;
}

export async function resolveCountryCode(
  headers: Headers,
  _ip: string | null,
): Promise<string | null> {
  // Prefer CDN/edge headers only — no external IP lookup hop (speed M7).
  return countryCodeFromHeaders(headers);
}

export function countryDisplayName(code: string | null | undefined, lang: string): string {
  if (!code) return "";
  const normalized = code.trim().toUpperCase();
  if (!normalized) return "";
  try {
    return new Intl.DisplayNames(lang, { type: "region" }).of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}
