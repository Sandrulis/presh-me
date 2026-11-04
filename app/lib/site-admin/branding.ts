export const MAX_BRAND_IMAGE_BYTES = 1_500_000;

/** Cached brand files — do not inline data URLs into every page. */
export const BRAND_ICON_PATH = "/brand/icon";
export const BRAND_LOGO_PATH = "/brand/logo";
export const BRAND_NOTIFICATION_ICON_PATH = "/brand/notification-icon";

/** Bust CDN/browser cache after admin branding save. */
export function brandAssetUrl(path: string, version: string | null | undefined): string {
  const token = version?.trim();
  if (!token) return path;
  return `${path}?v=${encodeURIComponent(token)}`;
}

/** “P” monogram path — matches studio sidebar / header logo mark. */
export const BRAND_MARK_P_PATH =
  "M2.2 2.4h6.4a3.4 3.4 0 0 1 0 6.8H5.2V13.6H2.2V2.4Zm3 4.6h3.1a1.1 1.1 0 0 0 0-2.2H5.2v2.2Z";

export function defaultBrandMarkFaviconDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0e1116"/><g transform="translate(8,8) scale(2)"><path d="${BRAND_MARK_P_PATH}" fill="#f4f6fb"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function isBrandImageUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("data:image/") ||
      /^https?:\/\//i.test(value) ||
      value.startsWith("/brand/"))
  );
}

export function normalizeBrandImageUrl(value: unknown): string | null {
  return isBrandImageUrl(value) ? value : null;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function siteInitialsFaviconDataUrl(name: string): string {
  const raw = name.trim() || "P";
  const parts = raw.split(/\s+/).filter(Boolean);
  const initials = escapeXml(
    (parts.length >= 2 ? `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}` : raw.slice(0, 2)).toUpperCase(),
  );
  const fontSize = initials.length > 1 ? 18 : 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0e1116"/><text x="16" y="16" dy="0.38em" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="800" fill="#f4f6fb">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function siteHeadIconUrl(logoUrl: string | null, faviconUrl: string | null): string {
  return faviconUrl || logoUrl || defaultBrandMarkFaviconDataUrl();
}

export function resolveActiveHeadIcon(
  defaultIcon: string,
  notificationFaviconUrl: string | null,
  hasAlert: boolean,
): string {
  if (hasAlert && notificationFaviconUrl) return notificationFaviconUrl;
  return defaultIcon;
}

export function brandImageMime(url: string): string {
  const match = /^data:(image\/[^;]+)/.exec(url);
  return match?.[1] ?? "image/png";
}

export function setDocumentFavicon(href: string): void {
  if (typeof document === "undefined") return;
  const type = brandImageMime(href.startsWith("data:") ? href : "data:image/png");
  const links = [...document.querySelectorAll<HTMLLinkElement>("link[rel]")].filter((link) => {
    const rel = link.rel.toLowerCase();
    return rel === "icon" || rel === "shortcut icon";
  });

  if (links.length > 0) {
    for (const link of links) {
      if (!link.isConnected) continue;
      try {
        if (href.startsWith("data:")) link.type = type;
        else link.removeAttribute("type");
        link.href = href;
      } catch {
        // Head may be reconciled by the framework; ignore stale nodes.
      }
    }
    return;
  }

  try {
    const icon = document.createElement("link");
    icon.rel = "icon";
    if (href.startsWith("data:")) icon.type = type;
    icon.href = href;
    document.head.appendChild(icon);
  } catch {
    // ignore
  }
}

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const name = file.name.toLowerCase();
  return [".ico", ".png", ".svg", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) => name.endsWith(ext));
}

function normalizeDataUrl(file: File, result: string): string | null {
  if (result.startsWith("data:image/")) return result;
  if (file.name.toLowerCase().endsWith(".ico") && result.startsWith("data:")) {
    return result.replace(/^data:[^;]*/, "data:image/x-icon");
  }
  return null;
}

export async function readBrandImageUrl(file: File): Promise<string | null> {
  if (!isLikelyImageFile(file) || file.size <= 0 || file.size > MAX_BRAND_IMAGE_BYTES) {
    return null;
  }
  const name = file.name.toLowerCase();
  const keepDataUrl =
    file.type === "image/svg+xml" ||
    file.type === "image/x-icon" ||
    name.endsWith(".svg") ||
    name.endsWith(".ico");
  if (keepDataUrl) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? normalizeDataUrl(file, reader.result) : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
  try {
    const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
    const result = await processAndUploadImage(file, {
      mode: "fit",
      maxEdge: 512,
      folder: "branding",
    });
    return result.ok ? result.url : null;
  } catch {
    return null;
  }
}
