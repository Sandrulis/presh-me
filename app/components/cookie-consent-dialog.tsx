"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCookieConsent } from "@/app/components/cookie-consent-context";
import { useTranslations } from "@/app/components/translations-provider";
import {
  DENIED_COOKIE_CONSENT_SELECTION,
  OPTIONAL_COOKIE_CONSENT_CATEGORIES,
  type CookieConsentSelection,
  type OptionalCookieConsentCategory,
} from "@/app/lib/consent/cookie-consent";

function PolicyLinks() {
  const { t } = useTranslations();
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <Link href="/cookies" className="font-semibold text-[var(--ink)] underline underline-offset-2">
        {t("cookies.policy", "Sīkdatņu politika")}
      </Link>
      <Link href="/privacy" className="font-semibold text-[var(--ink)] underline underline-offset-2">
        {t("cookies.privacy", "Privātuma politika")}
      </Link>
    </span>
  );
}

function ConsentSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-[var(--ink)]" : "bg-[#d8dee8]"
      }`}
    >
      <span
        className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function CookieConsentBanner() {
  const { acceptAll, rejectAll, openSettings } = useCookieConsent();
  const { t } = useTranslations();
  const title = t("cookies.banner.title", "Mēs izmantojam sīkdatnes");

  return (
    <div role="region" aria-label={title} className="fixed inset-x-0 bottom-0 z-[80] p-3 sm:p-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_18px_50px_rgba(14,17,22,0.16)] sm:p-6">
        <p className="text-base font-semibold tracking-[-0.02em] text-[var(--ink)]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {t(
            "cookies.banner.body",
            "Obligātās sīkdatnes ir nepieciešamas, lai sistēma darbotos. Preferenču, statistikas un mārketinga sīkdatnes izmantojam tikai ar tavu piekrišanu.",
          )}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          <PolicyLinks />
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={openSettings} className="btn-line w-full sm:w-auto">
            {t("cookies.customize", "Pielāgot")}
          </button>
          <button type="button" onClick={rejectAll} className="btn-line w-full sm:w-auto">
            {t("cookies.reject_optional", "Atteikt neobligātās")}
          </button>
          <button type="button" onClick={acceptAll} className="btn-ink w-full sm:w-auto">
            {t("cookies.accept_all", "Piekrist visām")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieConsentSettings({ open }: { open: boolean }) {
  const { consent, closeSettings, saveConsent, acceptAll, rejectAll } = useCookieConsent();
  const { t } = useTranslations();
  const [selection, setSelection] = useState<CookieConsentSelection>(
    () => consent?.categories ?? DENIED_COOKIE_CONSENT_SELECTION,
  );

  const optionalMeta: Record<
    OptionalCookieConsentCategory,
    { title: string; description: string }
  > = {
    preferences: {
      title: t("cookies.preferences.title", "Preferenču sīkdatnes"),
      description: t(
        "cookies.preferences.body",
        "Atceras tavas izvēles saskarnē, kad tās tiek ieviestas.",
      ),
    },
    analytics: {
      title: t("cookies.analytics.title", "Statistikas sīkdatnes"),
      description: t(
        "cookies.analytics.body",
        "Ļauj anonīmi mērīt lietojumu, ja analitika ir ieslēgta.",
      ),
    },
    marketing: {
      title: t("cookies.marketing.title", "Mārketinga sīkdatnes"),
      description: t(
        "cookies.marketing.body",
        "Personalizētai komunikācijai. Šobrīd netiek izmantota neviena mārketinga sīkdatne.",
      ),
    },
  };

  useEffect(() => {
    if (open) {
      setSelection(consent?.categories ?? DENIED_COOKIE_CONSENT_SELECTION);
    }
  }, [consent, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSettings();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeSettings, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(14,17,22,0.45)]"
        aria-label={t("actions.close", "Aizvērt")}
        onClick={closeSettings}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        className="relative z-[1] max-h-[min(90dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(14,17,22,0.2)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="cookie-settings-title" className="text-lg font-semibold tracking-[-0.02em]">
              {t("cookies.settings.title", "Sīkdatņu iestatījumi")}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t(
                "cookies.settings.subtitle",
                "Izvēlies, kuras sīkdatņu kategorijas atļaut. Izvēli vari mainīt jebkurā laikā.",
              )}
            </p>
          </div>
          <button
            type="button"
            className="btn-quiet shrink-0 px-2 py-1"
            onClick={closeSettings}
            aria-label={t("actions.close", "Aizvērt")}
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {t("cookies.necessary.title", "Obligātās sīkdatnes")}
              </p>
              <span className="shrink-0 rounded-full bg-[#e2e6ee] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                {t("cookies.necessary.always", "Vienmēr ieslēgtas")}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {t(
                "cookies.necessary.body",
                "Nodrošina drošību un tavas piekrišanas saglabāšanu. Bez tām sistēma nedarbojas.",
              )}
            </p>
          </div>

          {OPTIONAL_COOKIE_CONSENT_CATEGORIES.map((category) => {
            const meta = optionalMeta[category];
            return (
              <div key={category} className="rounded-xl border border-[var(--line)] bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">{meta.title}</p>
                  <ConsentSwitch
                    checked={selection[category]}
                    label={meta.title}
                    onChange={(checked) => setSelection((current) => ({ ...current, [category]: checked }))}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{meta.description}</p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-[var(--muted)]">
          <PolicyLinks />
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={rejectAll} className="btn-line">
            {t("cookies.reject_optional", "Atteikt neobligātās")}
          </button>
          <button type="button" onClick={acceptAll} className="btn-line">
            {t("cookies.accept_all", "Piekrist visām")}
          </button>
          <button type="button" onClick={() => saveConsent(selection)} className="btn-ink">
            {t("cookies.save_choice", "Saglabāt izvēli")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieConsentDialog() {
  const { isReady, hasDecision, isSettingsOpen } = useCookieConsent();
  const [mounted, setMounted] = useState(false);
  const [holdSettings, setHoldSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isSettingsOpen) {
      setHoldSettings(true);
      return;
    }
    const timer = window.setTimeout(() => setHoldSettings(false), 200);
    return () => window.clearTimeout(timer);
  }, [isSettingsOpen]);

  if (!mounted || !isReady) return null;

  return createPortal(
    <>
      {!hasDecision ? <CookieConsentBanner /> : null}
      {holdSettings || isSettingsOpen ? <CookieConsentSettings open={isSettingsOpen} /> : null}
    </>,
    document.body,
  );
}
