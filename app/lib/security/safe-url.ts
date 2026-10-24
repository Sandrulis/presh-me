/** Allow only http(s) absolute URLs for user-controlled hrefs. */
export function safeHttpUrl(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (/^(javascript|data|vbscript):/i.test(raw)) return null;
  return url.toString();
}
