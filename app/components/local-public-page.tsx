"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { PageView } from "@/app/components/page-view";
import { MissingHandle, PageSkeleton, UnpublishedPage } from "@/app/components/page-states";
import { getPageByHandle, getSessionId, loadPublicPage, subscribeStore } from "@/app/lib/store";
import type { Portfolio } from "@/app/lib/types";

type PublicView =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "hidden" }
  | { kind: "ready"; page: Portfolio };

export function LocalPublicPage({ handle }: { handle: string }) {
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const cached = useSyncExternalStore(
    subscribeStore,
    () => getPageByHandle(handle),
    () => null,
  );
  const [view, setView] = useState<PublicView>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const page = cached ?? (await loadPublicPage(handle));
      if (cancelled) return;
      if (!page || page.accountId === "example") {
        setView({ kind: "missing" });
        return;
      }
      if (!page.published && sessionId !== page.accountId) {
        setView({ kind: "hidden" });
        return;
      }
      setView({ kind: "ready", page });
      document.title = `${page.displayName || page.handle} · Presh`;
    })();
    return () => {
      cancelled = true;
    };
  }, [cached, handle, sessionId]);

  if (view.kind === "loading") return <PageSkeleton />;
  if (view.kind === "hidden") return <UnpublishedPage />;
  if (view.kind === "ready") return <PageView page={view.page} mode="live" />;
  return <MissingHandle handle={handle} />;
}
