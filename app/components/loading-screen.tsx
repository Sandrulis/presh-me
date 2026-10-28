"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { AuthShell } from "@/app/components/auth-shell";
import { Header } from "@/app/components/header";
import { useTranslations } from "@/app/components/translations-provider";

const KEY_FALLBACKS: Record<string, string> = {
  "common.loading": "Ielādē...",
  "page.loading": "Ielādē lapu...",
  "page.creating": "Veidoju lapu...",
  "studio.loading": "Ielādē studiju...",
};

export function LoadingIndicator({ label }: { label?: string }) {
  const { t } = useTranslations();
  const key = label ?? "common.loading";
  const isKey = key.includes(".") && !/\s/.test(key);
  const text = isKey ? t(key, KEY_FALLBACKS[key] ?? "Ielādē...") : key;

  return (
    <div className="grid justify-items-center gap-3">
      <span
        className="size-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--ink)]"
        aria-hidden="true"
      />
      <p className="m-0 text-[13px] font-medium text-[var(--muted)]">{text}</p>
    </div>
  );
}

/** Blurred page chrome behind a centered loader (maintenance gate, app boot, …). */
export function LoadingBlurOverlay({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh">
      <div aria-hidden="true" className="pointer-events-none min-h-dvh select-none blur-md brightness-[0.97]">
        {children}
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ink)]/10"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingIndicator label={label} />
      </div>
    </div>
  );
}

export function LoadingAppShellChrome() {
  return (
    <AppShell>
      <div className="min-h-[100dvh] bg-[var(--paper)]" />
    </AppShell>
  );
}

function LoadingAuthChrome() {
  const { t } = useTranslations();
  return (
    <AuthShell
      kicker={t("auth.login.kicker", "Pieslēgšanās")}
      title={t("auth.login.title", "Atpakaļ pie sava linka")}
      subtitle={t("auth.login.subtitle", "Pieslēdzies un turpini rediģēt lapu.")}
    >
      <div className="space-y-3" aria-hidden="true">
        <div className="h-11 rounded-xl bg-[var(--line)]/35" />
        <div className="h-11 rounded-xl bg-[var(--line)]/35" />
        <div className="h-11 rounded-xl bg-[var(--ink)]/15" />
      </div>
    </AuthShell>
  );
}

export function LoadingPublicPageChrome() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Header />
      <main className="mx-auto max-w-lg px-5 py-16">
        <div className="h-4 w-28 rounded bg-[var(--line)]/40" />
        <div className="mt-6 h-10 w-full max-w-md rounded-lg bg-[var(--line)]/30" />
        <div className="mt-4 h-4 w-full max-w-sm rounded bg-[var(--line)]/25" />
        <div className="mt-2 h-4 w-4/5 max-w-sm rounded bg-[var(--line)]/20" />
      </main>
    </div>
  );
}

type LoadingBackdrop = "app" | "auth" | "public";

export function LoadingScreen({
  label,
  backdrop = "app",
  children,
}: {
  label?: string;
  backdrop?: LoadingBackdrop;
  /** Custom chrome instead of a preset backdrop. */
  children?: ReactNode;
}) {
  let chrome = children;
  if (!chrome) {
    if (backdrop === "auth") chrome = <LoadingAuthChrome />;
    else if (backdrop === "public") chrome = <LoadingPublicPageChrome />;
    else chrome = <LoadingAppShellChrome />;
  }

  return <LoadingBlurOverlay label={label}>{chrome}</LoadingBlurOverlay>;
}
