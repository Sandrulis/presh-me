const SHORT_MAPS_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

/** Studio / bloka validācijai — saite der, arī īsā, kamēr vēl nav embedSrc. */
export function mapsBlockUrlAccepted(url: string, embedSrc?: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (embedSrc?.trim()) return true;
  if (googleMapsEmbedUrl(trimmed)) return true;
  if (isGoogleMapsShortLink(trimmed)) return true;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host.includes("google") && parsed.pathname.includes("/maps")) return true;
    if (host === "maps.google.com") return true;
  } catch {
    return false;
  }
  return false;
}

export function isGoogleMapsShortLink(raw: string): boolean {
  try {
    const withProtocol = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
    const host = new URL(withProtocol).hostname.replace(/^www\./, "");
    return SHORT_MAPS_HOSTS.has(host);
  } catch {
    return false;
  }
}

/** Google Maps saite vai embed kods → iframe src (bez īso saites izvēršanas). */
export function googleMapsEmbedUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const iframeMatch = value.match(/src\s*=\s*["']([^"']+)["']/i);
  const candidate = (iframeMatch?.[1] ?? value).trim();
  try {
    const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "");

    if (isGoogleMapsShortLink(withProtocol)) {
      return null;
    }

    if (url.pathname.includes("/maps/embed")) {
      return url.toString();
    }

    const searchCoord = url.pathname.match(/\/maps\/search\/([+-]?\d+(?:\.\d+)?),\s*\+?([+-]?\d+(?:\.\d+)?)/);
    if (searchCoord?.[1] && searchCoord[2] && host.includes("google")) {
      return `https://www.google.com/maps?q=${searchCoord[1]},${searchCoord[2]}&z=15&output=embed`;
    }

    const atMatch = url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch && host.includes("google")) {
      return `https://www.google.com/maps?q=${atMatch[1]},${atMatch[2]}&z=15&output=embed`;
    }

    const q = url.searchParams.get("q") ?? url.searchParams.get("query");
    if (q && host.includes("google") && !/^https?:\/\//i.test(q)) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
    }

    const placeMatch = url.pathname.match(/\/maps\/(?:place|search)\/([^/@?]+)/);
    if (placeMatch?.[1] && host.includes("google")) {
      const segment = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      const coordInSegment = segment.match(/^([+-]?\d+(?:\.\d+)?),\s*\+?([+-]?\d+(?:\.\d+)?)$/);
      if (coordInSegment) {
        return `https://www.google.com/maps?q=${coordInSegment[1]},${coordInSegment[2]}&z=15&output=embed`;
      }
      return `https://www.google.com/maps?q=${encodeURIComponent(segment)}&z=15&output=embed`;
    }
  } catch {
    return null;
  }
  return null;
}

/** Servera pusē seko redirectiem (piem. maps.app.goo.gl). */
export async function resolveGoogleMapsCanonicalUrl(raw: string): Promise<string | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    let current = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    for (let step = 0; step < 10; step += 1) {
      const response = await fetch(current, {
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PreshMe/1.0; +https://presh.me) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        current = new URL(location, current).toString();
        if (googleMapsEmbedUrl(current)) return current;
        continue;
      }
      if (response.ok || response.status === 0) {
        return googleMapsEmbedUrl(current) ? current : current;
      }
      return null;
    }
    return googleMapsEmbedUrl(current) ? current : null;
  } catch {
    return null;
  }
}

export async function resolveGoogleMapsEmbedUrl(raw: string): Promise<string | null> {
  const direct = googleMapsEmbedUrl(raw);
  if (direct) return direct;
  if (!isGoogleMapsShortLink(raw)) return null;
  const canonical = await resolveGoogleMapsCanonicalUrl(raw);
  if (!canonical) return null;
  return googleMapsEmbedUrl(canonical);
}
