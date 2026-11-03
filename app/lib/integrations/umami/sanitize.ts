const WEBSITE_ID = /^[a-f0-9-]{8,64}$/i;

export function sanitizeUmamiWebsiteId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return WEBSITE_ID.test(trimmed) ? trimmed : trimmed.replace(/[^a-f0-9-]/gi, "").slice(0, 64);
}

export function isValidUmamiWebsiteId(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && WEBSITE_ID.test(trimmed);
}
