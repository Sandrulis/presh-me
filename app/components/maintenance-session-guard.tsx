"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { fetchMaintenanceModeClient } from "@/app/lib/site-admin/maintenance-client";
import { isMaintenanceOverlayExcludedPath } from "@/app/lib/site-admin/maintenance-paths";
import { getSessionId, isSessionAdmin, logoutAccount, subscribeStore } from "@/app/lib/store";

/** Client fallback if middleware did not clear a stale non-admin session. */
export function MaintenanceSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const isAdmin = useSyncExternalStore(subscribeStore, isSessionAdmin, () => false);

  useEffect(() => {
    if (!sessionId || isAdmin) return;
    if (isMaintenanceOverlayExcludedPath(pathname)) return;

    void (async () => {
      if (!(await fetchMaintenanceModeClient())) return;
      await logoutAccount();
      router.replace("/");
      router.refresh();
    })();
  }, [isAdmin, pathname, router, sessionId]);

  return null;
}
