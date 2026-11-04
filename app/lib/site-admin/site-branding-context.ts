import { brandAssetUrl, normalizeBrandImageUrl } from "@/app/lib/site-admin/branding";

export type SiteBrandingContextValue = {
  systemName: string;
  hasCustomLogo: boolean;
  logoSrc: string | null;
  assetVersion: string;
};

/** Header / sidebar mark: admin logo, else favicon, with cache bust on remote URLs. */
export function resolveBrandingMarkSrc(
  logoUrl: string | null,
  faviconUrl: string | null,
  updatedAt: string,
): string | null {
  const raw = normalizeBrandImageUrl(logoUrl) ?? normalizeBrandImageUrl(faviconUrl);
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (updatedAt) url.searchParams.set("v", updatedAt);
      return url.toString();
    } catch {
      return raw;
    }
  }
  if (raw.startsWith("/brand/")) return brandAssetUrl(raw, updatedAt);
  return raw;
}

export function buildSiteBrandingContext(input: {
  systemName: string;
  logoUrl: string | null;
  faviconUrl?: string | null;
  updatedAt: string;
}): SiteBrandingContextValue {
  const logoSrc = resolveBrandingMarkSrc(input.logoUrl, input.faviconUrl ?? null, input.updatedAt);
  return {
    systemName: input.systemName.trim() || "Presh",
    hasCustomLogo: Boolean(logoSrc),
    logoSrc,
    assetVersion: input.updatedAt,
  };
}
