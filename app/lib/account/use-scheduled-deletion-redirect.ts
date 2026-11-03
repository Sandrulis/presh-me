"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const BLOCKED_PREFIXES = ["/studio", "/start"] as const;

function isBlockedAppPath(pathname: string) {
  return BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Redirect away from studio while account deletion is scheduled (settings stays open). */
export function useScheduledDeletionClientRedirect(deletionScheduled: boolean) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!deletionScheduled || !isBlockedAppPath(pathname)) return;
    router.replace("/settings?deletion=scheduled");
  }, [deletionScheduled, pathname, router]);
}
