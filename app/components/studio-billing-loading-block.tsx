"use client";

import { LoadingIndicator } from "@/app/components/loading-screen";
import { useTranslations } from "@/app/components/translations-provider";

type Props = {
  /** Small-caps header; omit with "none" while billing status is unknown. */
  header: "trial" | "subscription" | "none";
  /** i18n key or plain text for text under the spinner. */
  label?: string;
};

export function StudioBillingLoadingBlock({ header, label = "common.loading" }: Props) {
  const { t } = useTranslations();
  const headerLabel =
    header === "subscription"
      ? t("studio.subscription.label", "Abonements")
      : header === "trial"
        ? t("studio.trial.label", "Izmēģinājums")
        : null;

  return (
    <div className="border-t border-[var(--line)] pt-3">
      {headerLabel ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{headerLabel}</p>
      ) : (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-transparent" aria-hidden="true">
          —
        </p>
      )}
      <div className="py-4">
        <LoadingIndicator label={label} />
      </div>
    </div>
  );
}
