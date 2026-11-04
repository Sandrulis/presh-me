"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { refreshSiteAdmin } from "@/app/lib/site-admin/store";

const HYDRATE_PREFIXES = ["/admin", "/studio", "/settings", "/start"];

function shouldHydrateSiteAdmin(pathname: string): boolean {
  return HYDRATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Loads site_settings / languages / translations into client store only where needed. */
export function SiteAdminStoreHydrator() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldHydrateSiteAdmin(pathname)) return;
    void refreshSiteAdmin();
  }, [pathname]);

  return null;
}
