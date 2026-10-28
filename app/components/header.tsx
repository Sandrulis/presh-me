"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useHideMarketingHeader } from "@/app/components/auth-provider";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { Logo } from "@/app/components/logo";
import { useTranslations } from "@/app/components/translations-provider";
import { getSessionId, subscribeStore } from "@/app/lib/store";

function useSessionId() {
  return useSyncExternalStore(subscribeStore, getSessionId, () => null);
}

export function Header() {
  const sessionId = useSessionId();
  const hideMarketingHeader = useHideMarketingHeader();
  const { t } = useTranslations();

  if (sessionId || hideMarketingHeader) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Logo />
        <nav className="flex items-center gap-1.5" aria-label="Primary">
          <LanguageSwitcher variant="menu" />
          <Link href="/login" className="btn-quiet">
            {t("nav.login", "Pieslēgties")}
          </Link>
          <Link href="/register" className="btn-ink">
            {t("nav.start", "Sākt")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
