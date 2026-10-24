"use client";

import { useEffect, useSyncExternalStore } from "react";
import { listAdminTodos } from "@/app/lib/admin-todos";
import { setSiteHasAlert } from "@/app/lib/site-alerts-store";
import {
  getSessionId,
  isSessionAdmin,
  isStoreReady,
  subscribeStore,
} from "@/app/lib/store";

/**
 * Keeps tab badge favicon in sync with open system signals.
 * Currently: unfinished admin todos. Call setSiteHasAlert() from future
 * notification/news modules as they land.
 */
export function SiteAlertsBridge() {
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const isAdmin = useSyncExternalStore(subscribeStore, isSessionAdmin, () => false);

  useEffect(() => {
    if (!ready || !sessionId || !isAdmin) {
      setSiteHasAlert(false);
      return;
    }

    let cancelled = false;

    async function refresh() {
      try {
        const todos = await listAdminTodos(sessionId!);
        if (cancelled) return;
        setSiteHasAlert(todos.some((item) => !item.isDone));
      } catch {
        if (!cancelled) setSiteHasAlert(false);
      }
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [ready, sessionId, isAdmin]);

  return null;
}
