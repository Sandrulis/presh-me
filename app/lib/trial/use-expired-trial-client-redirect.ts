"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isTrialPeriodExpired } from "@/app/lib/trial/is-trial-expired";
import { isFrontendModuleEnabled } from "@/app/lib/site-admin/modules";
import { getSiteSettings, refreshSiteAdmin, subscribeSiteAdmin } from "@/app/lib/site-admin/store";
import { isStoreReady, readSessionPage, subscribeStore } from "@/app/lib/store";

const CLIENT_APP_PATHS = ["/studio", "/start", "/settings"] as const;

function isClientAppPath(pathname: string) {
  return CLIENT_APP_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Kad module_trail un trial beidzies, klienta zona → sākumlapa. */
export function useExpiredTrialClientRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const page = useSyncExternalStore(subscribeStore, readSessionPage, () => null);
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const [trailModuleEnabled, setTrailModuleEnabled] = useState(false);

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void isFrontendModuleEnabled("module_trail").then((enabled) => {
      if (!cancelled) setTrailModuleEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !page || !trailModuleEnabled || !isClientAppPath(pathname)) return;
    if (!isTrialPeriodExpired(page, settings.trialPeriodDays)) return;
    router.replace("/");
  }, [ready, page, trailModuleEnabled, settings.trialPeriodDays, pathname, router]);
}
