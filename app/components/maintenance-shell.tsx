"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { LoadingScreen } from "@/app/components/loading-screen";
import { MaintenanceModal } from "@/app/components/maintenance-modal";
import { isMaintenanceOverlayExcludedPath } from "@/app/lib/site-admin/maintenance-paths";
import { isSessionAdmin, isStoreReady, subscribeStore } from "@/app/lib/store";

/** Logged-in admins can use the app shell during maintenance (overlay stays on public pages). */
const ADMIN_APP_PATHS = ["/studio", "/start", "/settings"] as const;

function isAdminAppPath(pathname: string) {
  return ADMIN_APP_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function MaintenanceShell({
  active,
  sessionHint,
  children,
}: {
  active: boolean;
  sessionHint: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const storeReady = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const isAdmin = useSyncExternalStore(subscribeStore, isSessionAdmin, () => false);

  if (!active || isMaintenanceOverlayExcludedPath(pathname)) {
    return children;
  }

  // SSR confirmed session: resolve client store before maintenance UI.
  if (sessionHint && !storeReady) {
    return <LoadingScreen label="common.loading" backdrop="app" />;
  }

  if (!storeReady && isAdminAppPath(pathname)) {
    return <LoadingScreen label="common.loading" backdrop="app" />;
  }

  const showOverlay = !(isAdmin && isAdminAppPath(pathname));

  if (!showOverlay) return children;

  return (
    <div className="relative min-h-dvh">
      <div aria-hidden="true" className="pointer-events-none min-h-dvh select-none blur-md brightness-[0.97]">
        {children}
      </div>
      <MaintenanceModal />
    </div>
  );
}
