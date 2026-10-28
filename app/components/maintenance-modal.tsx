"use client";

import { useTranslations } from "@/app/components/translations-provider";

export function MaintenanceModal() {
  const { t } = useTranslations();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--ink)]/25 p-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {t("maintenance.kicker", "Apkope")}
        </p>
        <h2 id="maintenance-title" className="mt-2 font-display text-2xl font-semibold text-[var(--ink)]">
          {t("maintenance.title", "Sistēma īslaicīgi nav pieejama")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          {t(
            "maintenance.body",
            "Notiek apkopes darbi. Atvainojamies par sagādātajām neērtībām — drīz sistēma atkal būs pieejama.",
          )}
        </p>
      </div>
    </div>
  );
}
