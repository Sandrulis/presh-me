/** Safe JSON-LD for <script type="application/ld+json"> (escape `<`). */
export function jsonLdScriptHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function truncateMeta(text: string, max = 160): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

/** OG/Twitter only accept http(s) absolute URLs — skip data: and relative. */
export function publicShareImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}
