"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { AdminSidebar } from "@/app/components/admin-sidebar";
import { StudioSidebar } from "@/app/components/studio-sidebar";
import { useTranslations } from "@/app/components/translations-provider";
import {
  getSessionId,
  isSessionAdmin,
  logoutAccount,
  readSessionPage,
  subscribeStore,
} from "@/app/lib/store";

function useIsMobileShell() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 699px)");
    function sync() {
      setMobile(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return mobile;
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslations();
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const page = useSyncExternalStore(subscribeStore, readSessionPage, () => null);
  const showAdminRail = useSyncExternalStore(subscribeStore, isSessionAdmin, () => false);
  const isMobile = useIsMobileShell();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const anyOpen = menuOpen || adminOpen;

  useEffect(() => {
    if (!anyOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMenuOpen(false);
      setAdminOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyOpen]);

  useEffect(() => {
    if (!isMobile) return;
    setMenuOpen(false);
    setAdminOpen(false);
  }, [pathname, isMobile]);

  if (!sessionId) return <>{children}</>;

  return (
    <div
      className={`flex min-h-dvh flex-col bg-[var(--paper)] min-[700px]:grid min-[700px]:min-h-dvh min-[700px]:grid-cols-[var(--side)_minmax(0,1fr)_var(--admin)]`}
      style={
        {
          "--side": "3.5rem",
          "--admin": showAdminRail ? "3.5rem" : "0px",
        } as CSSProperties
      }
    >
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[var(--line)] bg-white px-3 py-2 min-[700px]:hidden">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={t("shell.open_menu", "Atvērt izvēlni")}
            aria-expanded={menuOpen}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)]"
            onClick={() => {
              setMenuOpen(true);
              setAdminOpen(false);
            }}
          >
            <IconBurger />
          </button>
          <Link href="/studio" className="inline-flex min-w-0 items-center gap-2 no-underline">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--ink)]">
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M2.2 2.4h6.4a3.4 3.4 0 0 1 0 6.8H5.2V13.6H2.2V2.4Zm3 4.6h3.1a1.1 1.1 0 0 0 0-2.2H5.2v2.2Z"
                  fill="#f4f6fb"
                />
              </svg>
            </span>
            <span className="truncate font-display text-base font-bold tracking-[-0.04em]">
              {page ? `/${page.handle}` : "presh"}
            </span>
          </Link>
        </div>
        {showAdminRail ? (
          <button
            type="button"
            aria-label={t("shell.open_admin", "Atvērt admin izvēlni")}
            aria-expanded={adminOpen}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)]"
            onClick={() => {
              setAdminOpen(true);
              setMenuOpen(false);
            }}
          >
            <IconBurger />
          </button>
        ) : (
          <button
            type="button"
            className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)]"
            onClick={() => {
              void logoutAccount().then(() => router.push("/"));
            }}
          >
            {t("nav.logout", "Iziet")}
          </button>
        )}
      </header>

      {anyOpen && isMobile ? (
        <button
          type="button"
          aria-label={t("shell.close_sidebar", "Aizvērt sānu joslu")}
          onClick={() => {
            setMenuOpen(false);
            setAdminOpen(false);
          }}
          className="fixed inset-0 z-30 bg-[var(--ink)]/25 min-[700px]:hidden"
        />
      ) : null}

      <div
        className={`relative z-40 ${menuOpen || !isMobile ? "block" : "hidden"} min-[700px]:block`}
        aria-hidden={isMobile ? !menuOpen : false}
      >
        <StudioSidebar
          open={menuOpen}
          mobile={isMobile}
          onOpenChange={(next) => {
            setMenuOpen(next);
            if (next) setAdminOpen(false);
          }}
        />
      </div>

      <div className="min-h-0 min-w-0 flex-1">{children}</div>

      {showAdminRail ? (
        <div
          className={`relative z-40 ${adminOpen || !isMobile ? "block" : "hidden"} min-[700px]:block`}
          aria-hidden={isMobile ? !adminOpen : false}
        >
          <AdminSidebar
            open={adminOpen}
            mobile={isMobile}
            onOpenChange={(next) => {
              setAdminOpen(next);
              if (next) setMenuOpen(false);
            }}
          />
        </div>
      ) : (
        <div className="hidden min-[700px]:block" />
      )}
    </div>
  );
}

function IconBurger() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h14" strokeLinecap="round" />
    </svg>
  );
}
