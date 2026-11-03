"use client";

import { useEffect, useState } from "react";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import { formatPlanPrice } from "@/app/lib/billing/format-plan-price";

type PlanOption = {
  planKey: string;
  name: string;
  priceAmount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onStartedCheckout?: () => void;
};

export function StudioPlanPickerDrawer({ open, onClose, onStartedCheckout }: Props) {
  const { t } = useTranslations();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/billing/plans", { credentials: "same-origin" });
        if (!res.ok) throw new Error("load_failed");
        const data = (await res.json()) as { plans: PlanOption[] };
        setPlans(data.plans ?? []);
      } catch {
        setError(t("studio.subscription.plans_load_failed", "Neizdevās ielādēt plānus."));
        setPlans([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, t]);

  async function choosePlan(planKey: string) {
    setBusyKey(planKey);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        if (data?.error === "stripe_unavailable") {
          setError(t("studio.subscription.stripe_unavailable", "Maksājumi nav pieejami. Sazinies ar atbalstu."));
        } else {
          setError(t("studio.subscription.checkout_failed", "Neizdevās sākt maksājumu."));
        }
        return;
      }
      onStartedCheckout?.();
      window.location.assign(data.url);
    } catch {
      setError(t("studio.subscription.checkout_failed", "Neizdevās sākt maksājumu."));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <SideDrawer
      open={open}
      side="left"
      title={t("studio.subscription.choose_plan_title", "Izvēlies plānu")}
      hint={t("studio.subscription.choose_plan_hint", "Mēneša abonements. Maksājumu apstrādā Stripe.")}
      onClose={onClose}
    >
      {loading ? (
        <p className="text-sm text-[var(--muted)]">{t("common.loading", "Ielādē…")}</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">{t("studio.subscription.no_plans", "Nav pieejamu plānu.")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {plans.map((plan) => (
            <li key={plan.planKey}>
              <button
                type="button"
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-left transition hover:border-[var(--ink)]/30"
                disabled={busyKey !== null}
                onClick={() => void choosePlan(plan.planKey)}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-[var(--ink)]">{plan.name}</span>
                  <span className="shrink-0 text-sm font-medium text-[var(--ink)]">
                    {formatPlanPrice(plan.priceAmount)}
                    <span className="text-[var(--muted)]"> / {t("studio.subscription.per_month", "mēn.")}</span>
                  </span>
                </div>
                {busyKey === plan.planKey ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">{t("studio.subscription.redirecting", "Novirza uz Stripe…")}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </SideDrawer>
  );
}
