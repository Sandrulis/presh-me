"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getSiteAlertSnapshot,
  subscribeSiteAlerts,
} from "@/app/lib/site-alerts-store";
import {
  resolveActiveHeadIcon,
  setDocumentFavicon,
} from "@/app/lib/site-admin/branding";

export function NotificationFavicon({
  defaultIcon,
  notificationIcon,
}: {
  defaultIcon: string;
  notificationIcon: string | null;
}) {
  const hasAlert = useSyncExternalStore(
    subscribeSiteAlerts,
    getSiteAlertSnapshot,
    () => false,
  );

  useEffect(() => {
    const href = resolveActiveHeadIcon(defaultIcon, notificationIcon, hasAlert);
    setDocumentFavicon(href);
  }, [defaultIcon, notificationIcon, hasAlert]);

  return null;
}
