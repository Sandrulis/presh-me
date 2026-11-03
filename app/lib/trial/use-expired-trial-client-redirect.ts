"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isTrialPeriodExpired } from "@/app/lib/trial/is-trial-expired";
import { isFrontendModuleEnabled } from "@/app/lib/site-admin/modules";
import { getSiteSettings, refreshSiteAdmin, subscribeSiteAdmin } from "@/app/lib/site-admin/store";
import { isStoreReady, readSessionPage, subscribeStore } from "@/app/lib/store";

/** Konta `/settings` paliek pieejams arī pēc trial (e-pasts, MFA, preferences). */
const TRIAL_LOCKOUT_PATHS = ["/studio", "/start"] as const;

function isTrialLockoutPath(pathname: string) {
  return TRIAL_LOCKOUT_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Kad module_trail un trial beidzies, klienta zona → sākumlapa (izņemot aktīvu abonementu). */
export function useExpiredTrialClientRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const page = useSyncExternalStore(subscribeStore, readSessionPage, () => null);
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const [trailModuleEnabled, setTrailModuleEnabled] = useState(false);
  const [paidAccess, setPaidAccess] = useState(false);
  const [billingResolved, setBillingResolved] = useState(false);

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
    if (!ready || !page) {
      setBillingResolved(false);
      setPaidAccess(false);
      return;
    }
    let cancelled = false;
    setBillingResolved(false);
    setPaidAccess(false);
    void fetch("/api/billing/status", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setPaidAccess(data?.hasActiveAccess === true);
      })
      .catch(() => {
        if (!cancelled) setPaidAccess(false);
      })
      .finally(() => {
        if (!cancelled) setBillingResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, page?.id]);

  useEffect(() => {
    if (!ready || !page || !trailModuleEnabled || !isTrialLockoutPath(pathname)) return;
    if (!isTrialPeriodExpired(page, settings.trialPeriodDays)) return;
    if (!billingResolved) return;
    if (paidAccess) return;
    router.replace("/");
  }, [
    ready,
    page,
    trailModuleEnabled,
    settings.trialPeriodDays,
    pathname,
    router,
    paidAccess,
    billingResolved,
  ]);
}
