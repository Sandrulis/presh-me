"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TranslationsProvider, useTranslations } from "@/app/components/translations-provider";
import { loadMessages } from "@/app/lib/i18n/load-messages";
import {
  isLanguageCode,
  type LanguageCode,
} from "@/app/lib/i18n/language";

/** Overrides UI strings in preview (studio) when the page has a fixed public language. */
export function PageLanguageScope({
  languageCode,
  children,
}: {
  languageCode?: string | null;
  children: ReactNode;
}) {
  const parent = useTranslations();
  const forced =
    languageCode && isLanguageCode(languageCode.trim()) ? (languageCode.trim() as LanguageCode) : null;
  const [table, setTable] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!forced || forced === parent.languageCode) {
      setTable(null);
      return;
    }
    let cancelled = false;
    void loadMessages(forced).then((messages) => {
      if (!cancelled) setTable(messages);
    });
    return () => {
      cancelled = true;
    };
  }, [forced, parent.languageCode]);

  if (!forced || forced === parent.languageCode) {
    return children;
  }
  if (!table) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center" role="status" aria-live="polite">
        <span className="inline-block size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--ink)]" />
      </div>
    );
  }

  return (
    <TranslationsProvider
      languageCode={forced}
      table={table}
      languages={parent.languages}
    >
      {children}
    </TranslationsProvider>
  );
}
