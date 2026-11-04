"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  buildSiteBrandingContext,
  type SiteBrandingContextValue,
} from "@/app/lib/site-admin/site-branding-context";
import {
  getSiteSettings,
  isSiteSettingsHydratedFromDb,
  subscribeSiteAdmin,
} from "@/app/lib/site-admin/store";

const SiteBrandingContext = createContext<SiteBrandingContextValue>({
  systemName: "Presh",
  hasCustomLogo: false,
  logoSrc: null,
  assetVersion: "",
});

export function SiteBrandingProvider({
  children,
  branding: initialBranding,
}: {
  children: ReactNode;
  branding: SiteBrandingContextValue;
}) {
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const hydrated = useSyncExternalStore(
    subscribeSiteAdmin,
    isSiteSettingsHydratedFromDb,
    () => false,
  );

  const branding = useMemo(() => {
    // Public pages keep server branding until admin/studio hydrates from DB.
    // Never let empty client defaults (systemName "Presh", logo null) win.
    if (!hydrated) return initialBranding;
    return buildSiteBrandingContext({
      systemName: settings.systemName,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      updatedAt: settings.updatedAt,
    });
  }, [hydrated, initialBranding, settings]);

  return <SiteBrandingContext.Provider value={branding}>{children}</SiteBrandingContext.Provider>;
}

export function useSiteBranding(): SiteBrandingContextValue {
  return useContext(SiteBrandingContext);
}
