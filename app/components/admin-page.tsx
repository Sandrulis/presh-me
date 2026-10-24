"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { LoadingScreen } from "@/app/components/loading-screen";
import { useTranslations } from "@/app/components/translations-provider";
import { getSessionId, isSessionAdmin, isStoreReady, subscribeStore } from "@/app/lib/store";

export function AdminPage({
  title,
  titleKey,
  titleFallback,
  actions,
  children,
  wide,
}: {
  title?: string;
  titleKey?: string;
  titleFallback?: string;
  actions?: ReactNode;
  children?: ReactNode;
  wide?: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const isAdmin = useSyncExternalStore(subscribeStore, isSessionAdmin, () => false);
  const heading = titleKey ? t(titleKey, titleFallback ?? title ?? titleKey) : title;

  useEffect(() => {
    if (!ready) return;
    if (!sessionId) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) router.replace("/studio");
  }, [ready, sessionId, isAdmin, router]);

  if (!ready || !sessionId || !isAdmin) {
    return <LoadingScreen />;
  }

  return (
    <AppShell>
      <main className={`mx-auto w-full px-5 py-10 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
        <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
          {t("admin.eyebrow", "Administrācija")}
        </p>
        {heading ? (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold tracking-[-0.04em]">{heading}</h1>
            {actions}
          </div>
        ) : null}
        <div className={heading ? "mt-6" : "mt-1"}>
          {children ?? (
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
              {t("admin.section.coming_soon", "Šī sadaļa vēl tiek gatavota. Drīzumā šeit būs saturs.")}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
