export type SourcePreview =
  | {
      ok: true;
      title: string;
      description: string;
      image: string | null;
      images: string[];
      links: { title: string; url: string }[];
    }
  | { ok: false; message: string };

export function instagramName(value: string) {
  const trimmed = value.trim().replace(/^@/, "");
  const fromUrl = trimmed.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const name = (fromUrl?.[1] ?? trimmed).split(/[/?#]/)[0] ?? "";
  if (!/^[A-Za-z0-9._]{1,30}$/.test(name)) return null;
  return name;
}

export function publicHttpUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (isBlockedHost(url.hostname)) return null;
  return url;
}

export function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host === "metadata.google.internal" || host === "metadata" || host.endsWith(".metadata.google.internal")) {
    return true;
  }
  if (host === "0.0.0.0" || host === "::" || host === "::1" || host === "0:0:0:0:0:0:0:1") return true;

  // IPv4
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const parts = ipv4.slice(1).map(Number);
    if (parts.some((part) => part > 255)) return true;
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  // IPv6 (simplified)
  if (host.includes(":")) {
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true;
    if (host.startsWith("::ffff:")) {
      const mapped = host.slice("::ffff:".length);
      return isBlockedHost(mapped);
    }
    return false;
  }

  return false;
}
