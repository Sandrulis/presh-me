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
        className="cursor-pointer text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
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
