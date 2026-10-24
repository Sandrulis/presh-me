"use client";

import { useTranslations } from "@/app/components/translations-provider";

const KEY_FALLBACKS: Record<string, string> = {
  "common.loading": "Ielādē...",
  "page.loading": "Ielādē lapu...",
  "page.creating": "Veidoju lapu...",
  "studio.loading": "Ielādē studiju...",
};

export function LoadingScreen({
  label,
}: {
  /** Translation key (e.g. `studio.loading`) or raw display text. */
  label?: string;
}) {
  const { t } = useTranslations();
  const key = label ?? "common.loading";
  const isKey = key.includes(".") && !/\s/.test(key);
  const text = isKey ? t(key, KEY_FALLBACKS[key] ?? "Ielādē...") : key;

  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-screen-card">
        <div className="loading-screen-mark" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="h-5 w-5">
            <path
              d="M2.2 2.4h6.4a3.4 3.4 0 0 1 0 6.8H5.2V13.6H2.2V2.4Zm3 4.6h3.1a1.1 1.1 0 0 0 0-2.2H5.2v2.2Z"
              fill="#f4f6fb"
            />
          </svg>
        </div>
        <div className="loading-screen-spinner" aria-hidden="true">
          <span />
        </div>
        <p className="loading-screen-label">{text}</p>
      </div>
    </div>
  );
}
