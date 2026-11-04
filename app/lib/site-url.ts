const PRODUCTION_ORIGIN = "https://presh.me";

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalOrPreviewHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".local")
  );
}

/**
 * Canonical public origin for SEO (canonical, OG, JSON-LD, sitemap).
 * Production always prefers https://presh.me — never emit localhost in production builds.
 */
export function getPublicSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured.includes("://") ? configured : `https://${configured}`);
      if (url.protocol === "http:" || url.protocol === "https:") {
        // Never ship preview/localhost as canonical in production
        if (process.env.NODE_ENV === "production" && isLocalOrPreviewHost(url.hostname)) {
          return PRODUCTION_ORIGIN;
        }
        return stripTrailingSlash(url.origin);
      }
    } catch {
      /* fall through */
    }
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_ORIGIN;
  }

  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/\/$/, "");
    if (isLocalOrPreviewHost(host)) {
      // Preview builds: still use production canonical for SEO tags if NODE_ENV=production
      return process.env.VERCEL_ENV === "production" ? PRODUCTION_ORIGIN : `https://${host}`;
    }
    return `https://${host}`;
  }

  return "http://localhost:3130";
}

/** ICS/webcal URLs must be reachable by Google/Apple servers — not localhost. */
export function getCalendarFeedOrigin(): string {
  const site = getPublicSiteUrl();
  try {
    const url = new URL(site);
    if (isLocalOrPreviewHost(url.hostname)) {
      return PRODUCTION_ORIGIN;
    }
    return stripTrailingSlash(url.origin);
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

export function absoluteUrl(path = "/"): string {
  const base = getPublicSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Next.js `app/opengraph-image.tsx` route. */
export const SITE_OG_IMAGE_PATH = "/opengraph-image";

export function siteOgImageUrl(): string {
  return absoluteUrl(SITE_OG_IMAGE_PATH);
}
