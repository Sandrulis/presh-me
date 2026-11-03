"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BillingIntervalToggle } from "@/app/components/billing-interval-toggle";
import { useTranslations } from "@/app/components/translations-provider";
import type { BillingInterval } from "@/app/lib/billing/billing-interval";
import { formatPlanPrice } from "@/app/lib/billing/format-plan-price";
import type { LandingPricingData, LandingPricingPlan } from "@/app/lib/pricing/load-landing-pricing";

function PlanMark({ included, label }: { included: boolean; label: string }) {
  return (
    <span
      className={
        included
          ? "inline-flex size-8 items-center justify-center rounded-full bg-[#ecfdf3] text-base font-bold text-[#166534]"
          : "inline-flex size-8 items-center justify-center rounded-full bg-[#f4f4f5] text-base font-bold text-[#a1a1aa]"
      }
      aria-label={label}
      role="img"
    >
      {included ? "✓" : "×"}
    </span>
  );
}

function resolvePlanPriceDisplay(plan: LandingPricingPlan, interval: BillingInterval) {
  if (plan.isFreeTier) {
    return {
      priceLabel: plan.priceLabel,
      periodKey: plan.periodKey,
    };
  }
  const amount = interval === "year" ? plan.priceAmountAnnual : plan.priceAmountMonthly;
  if (amount > 0) {
    return {
      priceLabel: formatPlanPrice(amount).replace("€ ", "€"),
      periodKey:
        interval === "year"
          ? ("landing.pricing.period.year" as const)
          : ("landing.pricing.pro.period" as const),
    };
  }
  return {
    priceLabel: plan.priceLabel,
    periodKey: plan.periodKey,
  };
}

function periodLabel(
  t: ReturnType<typeof useTranslations>["t"],
  periodKey: LandingPricingPlan["periodKey"],
) {
  if (!periodKey) return null;
  if (periodKey === "landing.pricing.period.beta") {
    return t("landing.pricing.period.beta", "beta");
  }
  if (periodKey === "landing.pricing.period.year") {
    return t("landing.pricing.period.year", "gads");
  }
  return t("landing.pricing.pro.period", "month");
}

export function LandingPricingSection({ pricing }: { pricing: LandingPricingData }) {
  const { t } = useTranslations();
  const { plans, features, paidCheckoutLive } = pricing;
  const showIntervalToggle = useMemo(
    () =>
      paidCheckoutLive &&
      plans.some(
        (plan) =>
          !plan.isFreeTier && (plan.priceAmountMonthly > 0 || plan.priceAmountAnnual > 0),
      ),
    [paidCheckoutLive, plans],
  );
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <section id="pricing" className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="font-display text-3xl font-bold tracking-[-0.03em]">
          {t("landing.pricing.title", "Pricing")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          {t(
            "landing.pricing.subtitle",
            "Start free in open beta. A Pro plan is planned — price below is a placeholder, not a live checkout.",
          )}
        </p>

        {showIntervalToggle ? (
          <div className="mt-6">
            <BillingIntervalToggle
              value={interval}
              onChange={setInterval}
              monthlyLabel={t("billing.interval.monthly", "Mēneša")}
              annualLabel={t("billing.interval.annual", "Gada")}
              ariaLabel={t("billing.interval.aria", "Norēķinu periods")}
            />
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const display = resolvePlanPriceDisplay(plan, interval);
            const period = periodLabel(t, display.periodKey);
            return (
              <article
                key={plan.planKey}
                className={
                  plan.highlighted
                    ? "rounded-2xl border border-[var(--ink)] bg-[var(--paper)] p-5"
                    : "rounded-2xl border border-[var(--line)] bg-white p-5"
                }
              >
                <p
                  className={
                    plan.highlighted
                      ? "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]"
                      : "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
                  }
                >
                  {t(plan.badgeKey, plan.name)}
                </p>
                <p className="mt-3 font-display text-4xl font-bold tracking-[-0.03em]">
                  {display.priceLabel}
                  {period ? (
                    <span className="text-base font-sans font-normal text-[var(--muted)]">
                      {" "}
                      / {period}
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{t(plan.bodyKey, plan.name)}</p>
                {plan.showCta ? (
                  <Link href="/register" className="btn-ink mt-5 inline-flex">
                    {t("landing.pricing.cta", "Start for free")}
                  </Link>
                ) : plan.comingSoon ? (
                  <p className="mt-5 text-sm font-medium text-[var(--muted)]">
                    {t("landing.pricing.pro.soon", "Not available to buy yet.")}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <caption className="sr-only">
              {t("landing.pricing.compare.caption", "Plan feature comparison")}
            </caption>
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--paper)]">
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--ink)]">
                  {t("landing.pricing.compare.feature", "Feature")}
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.planKey}
                    scope="col"
                    className="px-4 py-3 text-center font-semibold text-[var(--ink)]"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {features.map((feature) => (
                <tr key={feature.id} className="bg-white">
                  <th scope="row" className="px-4 py-3 font-normal text-[var(--ink)]">
                    {t(feature.labelKey, feature.id)}
                  </th>
                  {plans.map((plan) => {
                    const included = feature.includedByPlan[plan.planKey] === true;
                    return (
                      <td key={plan.planKey} className="px-4 py-3 text-center">
                        <PlanMark
                          included={included}
                          label={
                            included
                              ? t("landing.pricing.compare.included", "Included")
                              : t("landing.pricing.compare.not_included", "Not included")
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
