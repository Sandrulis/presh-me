"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  buildSiteBrandingContext,
  type SiteBrandingContextValue,
} from "@/app/lib/site-admin/site-branding-context";
import { getSiteSettings, refreshSiteAdmin, subscribeSiteAdmin } from "@/app/lib/site-admin/store";
import { useSyncExternalStore } from "react";

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

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  const branding = useMemo(() => {
    if (!settings.updatedAt) return initialBranding;
    return buildSiteBrandingContext({
      systemName: settings.systemName,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      updatedAt: settings.updatedAt,
    });
  }, [initialBranding, settings]);

  return <SiteBrandingContext.Provider value={branding}>{children}</SiteBrandingContext.Provider>;
}

export function useSiteBranding(): SiteBrandingContextValue {
  return useContext(SiteBrandingContext);
}
