"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ConfirmDialog } from "@/app/components/admin-ui";
import { FeedbackToasts, useNotices, type NoticeTone } from "@/app/components/feedback-toast";
import {
  StudioBillingCancelButton,
  StudioBillingResumeButton,
} from "@/app/components/studio-billing-plan-button";
import { BillingIntervalToggle } from "@/app/components/billing-interval-toggle";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import type { BillingInterval } from "@/app/lib/billing/billing-interval";
import { comparePlanChange, type PlanTier } from "@/app/lib/billing/plan-change";
import { takeLandingCheckoutPlan } from "@/app/lib/billing/pending-landing-plan";
import { formatPlanPrice } from "@/app/lib/billing/format-plan-price";
import { useBillingStatus } from "@/app/lib/billing/use-billing-status";
import {
  EMPTY_USER_DISPLAY_PREFERENCES,
  mergeDisplayPreferences,
  previewDisplayDate,
  siteDisplayFromSettings,
} from "@/app/lib/display-preferences";
import { getSiteSettings, subscribeSiteAdmin } from "@/app/lib/site-admin/store";

type PlanOption = {
  planKey: string;
  name: string;
  priceAmount: number;
  priceAmountAnnual: number;
  sortOrder: number;
};

function planTier(plan: PlanOption): PlanTier {
  return {
    planKey: plan.planKey,
    sortOrder: plan.sortOrder,
    priceAmount: plan.priceAmount,
    priceAmountAnnual: plan.priceAmountAnnual,
  };
}

function checkoutInterval(plan: PlanOption, interval: BillingInterval): BillingInterval {
  if (interval === "year" && plan.priceAmountAnnual > 0) return "year";
  return "month";
}

function displayPrice(plan: PlanOption, interval: BillingInterval) {
  if (interval === "year" && plan.priceAmountAnnual > 0) {
    return { amount: plan.priceAmountAnnual, perKey: "studio.subscription.per_year" as const };
  }
  return { amount: plan.priceAmount, perKey: "studio.subscription.per_month" as const };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onStartedCheckout?: () => void;
};

export function StudioPlanPickerDrawer({ open, onClose, onStartedCheckout }: Props) {
  const { t } = useTranslations();
  const { notices, notify, dismissNotice } = useNotices();
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const display = useMemo(
    () => mergeDisplayPreferences(siteDisplayFromSettings(settings), EMPTY_USER_DISPLAY_PREFERENCES),
    [settings],
  );
  const { status, reload: reloadStatus } = useBillingStatus({ refreshKey: open ? "picker" : "closed" });
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"cancel" | "resume" | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [confirmPlanKey, setConfirmPlanKey] = useState<string | null>(null);

  function toast(text: string, tone: NoticeTone = "info") {
    notify(text, tone);
  }

  const showIntervalToggle = useMemo(
    () => plans.length > 0 && plans.every((plan) => plan.priceAmountAnnual > 0),
    [plans],
  );

  const hasActiveSubscription = status.hasActiveAccess;
  const currentPlanKey = status.subscription?.planKey ?? null;
  const phase = status.phase;
  const currentBillingInterval = status.subscription?.billingInterval ?? "month";

  const currentPlanOption = useMemo(
    () => plans.find((plan) => plan.planKey === currentPlanKey) ?? null,
    [plans, currentPlanKey],
  );

  const periodLabel = useMemo(() => {
    const iso = status.subscription?.currentPeriodEnd ?? null;
    if (!iso) return "—";
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return "—";
    return previewDisplayDate({ ...display, timeZone: "Europe/Riga" }, new Date(ms)).date;
  }, [display, status.subscription?.currentPeriodEnd]);

  const pendingEffectiveLabel = useMemo(() => {
    const iso = status.subscription?.pendingEffectiveAt ?? null;
    if (!iso) return "—";
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return "—";
    return previewDisplayDate({ ...display, timeZone: "Europe/Riga" }, new Date(ms)).date;
  }, [display, status.subscription?.pendingEffectiveAt]);

  const confirmPlan = useMemo(
    () => plans.find((plan) => plan.planKey === confirmPlanKey) ?? null,
    [plans, confirmPlanKey],
  );

  const confirmDirection = useMemo(() => {
    if (!confirmPlan || !currentPlanOption) return null;
    return comparePlanChange(
      planTier(currentPlanOption),
      planTier(confirmPlan),
      currentBillingInterval,
      checkoutInterval(confirmPlan, interval),
    );
  }, [confirmPlan, currentBillingInterval, currentPlanOption, interval]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void reloadStatus();
    void (async () => {
      try {
        const res = await fetch("/api/billing/plans", { credentials: "same-origin" });
        if (!res.ok) throw new Error("load_failed");
        const data = (await res.json()) as { plans: PlanOption[] };
        setPlans(data.plans ?? []);
      } catch {
        toast(t("studio.subscription.plans_load_failed", "Neizdevās ielādēt plānus."), "error");
        setPlans([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, reloadStatus, t]);

  useEffect(() => {
    if (!open || loading || plans.length === 0 || hasActiveSubscription) return;
    const pending = takeLandingCheckoutPlan();
    if (!pending || !plans.some((plan) => plan.planKey === pending)) return;
    void startCheckout(pending);
  }, [open, loading, plans, hasActiveSubscription]);

  async function startCheckout(planKey: string) {
    const plan = plans.find((item) => item.planKey === planKey);
    if (!plan) return;
    const billingInterval = checkoutInterval(plan, interval);
    setBusyKey(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billingInterval }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        if (data?.error === "stripe_unavailable") {
          toast(t("studio.subscription.stripe_unavailable", "Maksājumi nav pieejami. Sazinies ar atbalstu."), "error");
        } else if (data?.error === "active_subscription") {
          toast(
            t(
              "studio.subscription.use_plan_change",
              "Tev jau ir aktīvs abonements. Izvēlies citu plānu un apstiprini maiņu.",
            ),
            "error",
          );
        } else {
          toast(t("studio.subscription.checkout_failed", "Neizdevās sākt maksājumu."), "error");
        }
        return;
      }
      onStartedCheckout?.();
      window.location.assign(data.url);
    } catch {
      toast(t("studio.subscription.checkout_failed", "Neizdevās sākt maksājumu."), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function applyPlanChange(planKey: string) {
    const plan = plans.find((item) => item.planKey === planKey);
    if (!plan) return;
    const billingInterval = checkoutInterval(plan, interval);
    setBusyKey(planKey);
    try {
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billingInterval }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        change?: "upgrade" | "downgrade";
        effectiveAt?: string | null;
        error?: string;
      } | null;
      if (!res.ok || !data?.ok) {
        if (data?.error === "same_plan") {
          toast(t("studio.subscription.same_plan", "Tu jau esi šajā plānā."), "error");
        } else {
          toast(t("studio.subscription.change_plan_failed", "Neizdevās mainīt plānu."), "error");
        }
        return;
      }
      if (data.change === "upgrade") {
        toast(
          t(
            "studio.subscription.upgrade_success",
            "Plāns uzlabots. Stripe iekasēs proporcionālu starpību par atlikušo periodu.",
          ),
          "ok",
        );
      } else {
        toast(
          t(
            "studio.subscription.downgrade_success",
            "Zemākais plāns stāsies spēkā perioda beigās. Līdz tam paliek pašreizējais plāns.",
          ),
          "ok",
        );
      }
      await reloadStatus();
    } catch {
      toast(t("studio.subscription.change_plan_failed", "Neizdevās mainīt plānu."), "error");
    } finally {
      setBusyKey(null);
      setConfirmPlanKey(null);
    }
  }

  function onSelectPlan(planKey: string) {
    if (hasActiveSubscription) {
      setConfirmPlanKey(planKey);
      return;
    }
    void startCheckout(planKey);
  }

  async function postAction(path: "/api/billing/cancel" | "/api/billing/resume") {
    setBusyAction(path === "/api/billing/cancel" ? "cancel" : "resume");
    try {
      const res = await fetch(path, { method: "POST", credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      await reloadStatus();
    } catch {
      toast(t("studio.subscription.action_failed", "Darbība neizdevās. Mēģini vēlreiz."), "error");
    } finally {
      setBusyAction(null);
    }
  }

  const actionBusy = busyAction !== null;

  return (
    <>
      <SideDrawer
        open={open}
        side="left"
        title={t("studio.subscription.choose_plan_title", "Izvēlies plānu")}
        hint={t(
          hasActiveSubscription
            ? "studio.subscription.plan_change_hint"
            : "studio.subscription.choose_plan_hint",
          hasActiveSubscription
            ? "Augstāks plāns stājas spēkā uzreiz (proporcionāla piemaksa). Zemāks — perioda beigās."
            : "Maksājumu apstrādā Stripe.",
        )}
        onClose={onClose}
      >
        {showIntervalToggle ? (
          <div className="mb-4">
            <BillingIntervalToggle
              value={interval}
              onChange={setInterval}
              monthlyLabel={t("billing.interval.monthly", "Mēneša")}
              annualLabel={t("billing.interval.annual", "Gada")}
              ariaLabel={t("billing.interval.aria", "Norēķinu periods")}
            />
          </div>
        ) : null}
        {loading ? (
          <p className="text-sm text-[var(--muted)]">{t("common.loading", "Ielādē…")}</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("studio.subscription.no_plans", "Nav pieejamu plānu.")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {plans.map((plan) => {
              const isCurrent =
                currentPlanKey === plan.planKey && (phase === "active" || phase === "canceling");
              const price = displayPrice(plan, isCurrent ? currentBillingInterval : interval);
              if (isCurrent) {
                return (
                  <li key={plan.planKey}>
                    <div className="rounded-xl border border-[var(--ink)]/15 bg-[var(--paper)] px-4 py-3">
                      <p className="font-semibold text-[var(--ink)]">{plan.name}</p>
                      <p className="mt-0.5 text-sm font-medium text-[var(--ink)]">
                        {formatPlanPrice(price.amount)}
                        <span className="text-[var(--muted)]">
                          {" "}
                          /{" "}
                          {t(
                            currentBillingInterval === "year"
                              ? "studio.subscription.per_year"
                              : "studio.subscription.per_month",
                            currentBillingInterval === "year" ? "gads" : "mēn.",
                          )}
                        </span>
                      </p>
                      {status.subscription?.pendingPlanName ? (
                        <p className="mt-2 text-xs text-amber-800">
                          {t(
                            "studio.subscription.pending_plan",
                            "No {date} plāns mainīsies uz {name}.",
                            {
                              date: pendingEffectiveLabel,
                              name: status.subscription.pendingPlanName,
                            },
                          )}
                        </p>
                      ) : null}
                      {phase === "canceling" ? (
                        <StudioBillingResumeButton
                          loading={busyAction === "resume"}
                          onClick={() => void postAction("/api/billing/resume")}
                        >
                          {busyAction === "resume"
                            ? t("studio.subscription.resuming", "Atjauno…")
                            : t("studio.subscription.resume", "Atjaunot abonementu")}
                        </StudioBillingResumeButton>
                      ) : (
                        <StudioBillingCancelButton
                          loading={busyAction === "cancel"}
                          onClick={() => void postAction("/api/billing/cancel")}
                        >
                          {busyAction === "cancel"
                            ? t("studio.subscription.canceling", "Atceļ…")
                            : t("studio.subscription.cancel", "Atteikt abonementu")}
                        </StudioBillingCancelButton>
                      )}
                    </div>
                    <p
                      className={`mt-2 px-1 text-[13px] ${
                        phase === "canceling" ? "text-amber-700" : "text-[var(--muted)]"
                      }`}
                    >
                      {phase === "canceling"
                        ? t("studio.subscription.ends_on", "Beidzas {date} (tiks apturēts).", {
                            date: periodLabel,
                          })
                        : t("studio.subscription.renews_on", "Nākamā maksa {date}.", { date: periodLabel })}
                    </p>
                  </li>
                );
              }

              const direction =
                hasActiveSubscription && currentPlanOption
                  ? comparePlanChange(
                      planTier(currentPlanOption),
                      planTier(plan),
                      currentBillingInterval,
                      checkoutInterval(plan, interval),
                    )
                  : null;

              return (
                <li key={plan.planKey}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-left transition hover:border-[var(--ink)]/30"
                    disabled={busyKey !== null || actionBusy}
                    onClick={() => onSelectPlan(plan.planKey)}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-[var(--ink)]">{plan.name}</span>
                      <span className="shrink-0 text-sm font-medium text-[var(--ink)]">
                        {formatPlanPrice(price.amount)}
                        <span className="text-[var(--muted)]">
                          {" "}
                          / {t(price.perKey, price.perKey === "studio.subscription.per_year" ? "gads" : "mēn.")}
                        </span>
                      </span>
                    </div>
                    {direction === "upgrade" ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {t("studio.subscription.upgrade_note", "Uzreiz ar proporcionālu piemaksu.")}
                      </p>
                    ) : direction === "downgrade" ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {t("studio.subscription.downgrade_note", "Spēkā perioda beigās ({date}).", {
                          date: periodLabel,
                        })}
                      </p>
                    ) : null}
                    {busyKey === plan.planKey ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {hasActiveSubscription
                          ? t("studio.subscription.changing_plan", "Maina plānu…")
                          : t("studio.subscription.redirecting", "Novirza uz Stripe…")}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SideDrawer>

      <ConfirmDialog
        open={confirmPlanKey !== null && confirmPlan !== null}
        title={
          confirmDirection === "downgrade"
            ? t("studio.subscription.confirm_downgrade_title", "Pazemināt plānu?")
            : t("studio.subscription.confirm_upgrade_title", "Paaugstināt plānu?")
        }
        description={
          confirmDirection === "downgrade" ? (
            <p>
              {t(
                "studio.subscription.confirm_downgrade_body",
                "Pašreizējais plāns paliks aktīvs līdz {date}. Pēc tam abonements turpināsies ar zemāku plānu.",
                { date: periodLabel },
              )}
            </p>
          ) : (
            <p>
              {t(
                "studio.subscription.confirm_upgrade_body",
                "Plāns mainīsies uzreiz. Stripe iekasēs proporcionālu starpību par atlikušo norēķinu periodu.",
              )}
            </p>
          )
        }
        confirmLabel={t("studio.subscription.confirm_change", "Mainīt plānu")}
        confirmTone="default"
        busy={busyKey !== null}
        onClose={() => {
          if (busyKey === null) setConfirmPlanKey(null);
        }}
        onConfirm={() => {
          if (confirmPlanKey) void applyPlanChange(confirmPlanKey);
        }}
      />
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
    </>
  );
}
