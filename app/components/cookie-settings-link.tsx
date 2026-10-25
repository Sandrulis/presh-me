"use client";

import { useCookieConsent } from "@/app/components/cookie-consent-context";
import { useTranslations } from "@/app/components/translations-provider";

export function CookieSettingsLink({ variant = "button" }: { variant?: "button" | "footer" }) {
  const { openSettings } = useCookieConsent();
  const { t } = useTranslations();

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={openSettings}
        className="m-0 inline-block border-0 bg-transparent p-0 text-left text-sm font-normal text-[var(--ink)] underline-offset-2 hover:underline"
      >
        {t("cookies.settings.title", "Sīkdatņu iestatījumi")}
      </button>
    );
  }

  return (
    <button type="button" onClick={openSettings} className="btn-ink">
      {t("cookies.settings.title", "Sīkdatņu iestatījumi")}
    </button>
  );
}
