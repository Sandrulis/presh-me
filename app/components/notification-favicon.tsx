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
    if (!notificationIcon) return;
    const href = resolveActiveHeadIcon(defaultIcon, notificationIcon, hasAlert);
    setDocumentFavicon(href);
    return () => {
      setDocumentFavicon(defaultIcon);
    };
  }, [defaultIcon, notificationIcon, hasAlert]);

  return null;
}
