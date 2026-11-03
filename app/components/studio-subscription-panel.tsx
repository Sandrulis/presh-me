"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  StudioBillingCancelButton,
  StudioBillingPlanButton,
  StudioBillingResumeButton,
} from "@/app/components/studio-billing-plan-button";
import { useTranslations } from "@/app/components/translations-provider";
import type { BillingStatusPayload } from "@/app/lib/billing/use-billing-status";
import { mergeDisplayPreferences, previewDisplayDate, siteDisplayFromSettings, EMPTY_USER_DISPLAY_PREFERENCES } from "@/app/lib/display-preferences";
import { getSiteSettings, subscribeSiteAdmin } from "@/app/lib/site-admin/store";

type Props = {
  status: BillingStatusPayload;
  onChoosePlan: () => void;
  onChanged: () => void;
};

function formatPeriodEnd(iso: string | null, prefs: ReturnType<typeof mergeDisplayPreferences>) {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  return previewDisplayDate({ ...prefs, timeZone: "Europe/Riga" }, new Date(ms)).date;
}

export function StudioSubscriptionPanel({ status, onChoosePlan, onChanged }: Props) {
  const { t } = useTranslations();
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const display = useMemo(
    () => mergeDisplayPreferences(siteDisplayFromSettings(settings), EMPTY_USER_DISPLAY_PREFERENCES),
    [settings],
  );
  const [busy, setBusy] = useState<"cancel" | "resume" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sub = status.subscription;
  const phase = status.phase;
  const planLabel = sub?.planName?.trim() || sub?.planKey || t("studio.subscription.plan_unknown", "Plāns");

  async function postAction(path: "/api/billing/cancel" | "/api/billing/resume") {
    setFeedback(null);
    setBusy(path === "/api/billing/cancel" ? "cancel" : "resume");
    try {
      const res = await fetch(path, { method: "POST", credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      onChanged();
    } catch {
      setFeedback(t("studio.subscription.action_failed", "Darbība neizdevās. Mēģini vēlreiz."));
    } finally {
      setBusy(null);
    }
  }

  const periodLabel = formatPeriodEnd(sub?.currentPeriodEnd ?? null, display);

  return (
    <div className="border-t border-[var(--line)] pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {t("studio.subscription.label", "Abonements")}
      </p>

      {phase === "active" || phase === "canceling" ? (
        <>
          <p className="mt-1 text-[13px] font-medium text-[var(--ink)]">{planLabel}</p>
          {phase === "canceling" ? (
            <p className="mt-1 text-[13px] text-amber-700">
              {t("studio.subscription.ends_on", "Beidzas {date} (tiks apturēts).", { date: periodLabel })}
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {t("studio.subscription.renews_on", "Nākamā maksa {date}.", { date: periodLabel })}
            </p>
          )}
          <div className="mt-2">
            {phase === "canceling" ? (
              <StudioBillingResumeButton loading={busy === "resume"} onClick={() => void postAction("/api/billing/resume")}>
                {busy === "resume"
                  ? t("studio.subscription.resuming", "Atjauno…")
                  : t("studio.subscription.resume", "Atjaunot abonementu")}
              </StudioBillingResumeButton>
            ) : (
              <StudioBillingCancelButton loading={busy === "cancel"} onClick={() => void postAction("/api/billing/cancel")}>
                {busy === "cancel"
                  ? t("studio.subscription.canceling", "Atceļ…")
                  : t("studio.subscription.cancel", "Atteikt abonementu")}
              </StudioBillingCancelButton>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-[13px] font-medium text-red-600">
            {t("studio.subscription.ended", "Abonements beidzies.")}
          </p>
          <StudioBillingPlanButton onClick={onChoosePlan}>
            {t("studio.subscription.activate", "Aktivizēt abonementu")}
          </StudioBillingPlanButton>
        </>
      )}

      {feedback ? <p className="mt-2 text-xs text-red-600">{feedback}</p> : null}
    </div>
  );
}
