"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { computeTrialProgress } from "@/app/lib/trial/compute-trial-progress";
import { formatTrialExpiredMessage } from "@/app/lib/trial/format-trial-expired-message";
import { trialProgressFillColor } from "@/app/lib/trial/trial-bar-colors";
import { getSiteSettings, refreshSiteAdmin, subscribeSiteAdmin } from "@/app/lib/site-admin/store";

type Props = {
  trialStartedAt: string;
};

export function StudioTrialMeter({ trialStartedAt }: Props) {
  const { t } = useTranslations();
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const progress = computeTrialProgress(trialStartedAt, settings.trialPeriodDays, nowMs);
  if (!progress) return null;

  const summary = progress.expired
    ? formatTrialExpiredMessage(t, progress.trialEndMs, nowMs)
    : progress.daysRemaining === 1
      ? t("studio.trial.remaining_one", "Atlikusi 1 diena")
      : t("studio.trial.remaining", "Atlikušas {days} dienas", { days: String(progress.daysRemaining) });

  const dayCounter = t("studio.trial.days_of", "Diena {current} no {total}", {
    current: String(Math.min(progress.totalDays, progress.daysElapsed + 1)),
    total: String(progress.totalDays),
  });

  const fillColor = trialProgressFillColor(progress.ratio);

  return (
    <div className="border-t border-[var(--line)] pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {t("studio.trial.label", "Izmēģinājums")}
      </p>
      {progress.expired ? (
        <p className={`mt-1 text-[13px] font-medium text-red-600`}>{summary}</p>
      ) : (
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="min-w-0 text-[13px] font-medium text-[var(--ink)]">{summary}</p>
          <p className="shrink-0 text-xs text-[var(--muted)]">{dayCounter}</p>
        </div>
      )}
      <div
        className="mt-2 flex gap-0.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progress.totalDays}
        aria-valuenow={progress.expired ? progress.totalDays : progress.daysElapsed}
        aria-label={summary}
      >
        {Array.from({ length: progress.totalDays }, (_, index) => {
          let fill = 0;
          if (index < progress.daysElapsed) fill = 1;
          else if (index === progress.daysElapsed && !progress.expired) fill = progress.currentSegmentRatio;
          else if (progress.expired) fill = 1;

          return (
            <div
              key={index}
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-[var(--line)]"
              aria-hidden="true"
            >
              {fill > 0 ? (
                <div
                  className="h-full rounded-sm transition-[width]"
                  style={{
                    width: `${Math.max(fill * 100, 8)}%`,
                    backgroundColor: fillColor,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
