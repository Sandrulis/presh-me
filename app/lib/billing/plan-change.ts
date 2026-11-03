import type Stripe from "stripe";
import { parseBillingInterval, type BillingInterval } from "@/app/lib/billing/billing-interval";
import { eurosToCents } from "@/app/lib/billing/format-plan-price";
import { stripeSubscriptionPeriodEndMs } from "@/app/lib/billing/subscription-access";

export type PlanChangeDirection = "upgrade" | "downgrade" | "same";

export type PlanTier = {
  planKey: string;
  sortOrder: number;
  priceAmount: number;
  priceAmountAnnual: number;
};

export function planAmountForInterval(plan: PlanTier, interval: BillingInterval): number {
  if (interval === "year") return plan.priceAmountAnnual;
  return plan.priceAmount;
}

export function comparePlanChange(
  current: PlanTier,
  target: PlanTier,
  currentInterval: BillingInterval,
  targetInterval: BillingInterval,
): PlanChangeDirection {
  if (current.planKey === target.planKey && currentInterval === targetInterval) {
    return "same";
  }
  if (target.sortOrder !== current.sortOrder) {
    return target.sortOrder > current.sortOrder ? "upgrade" : "downgrade";
  }
  const currentEffective = planAmountForInterval(current, currentInterval);
  const targetEffective = planAmountForInterval(target, targetInterval);
  if (targetEffective > currentEffective) return "upgrade";
  if (targetEffective < currentEffective) return "downgrade";
  return current.planKey === target.planKey && currentInterval === targetInterval ? "same" : "upgrade";
}

export async function createStripePriceForPlan(
  stripe: Stripe,
  input: {
    planKey: string;
    planName: string;
    amount: number;
    interval: BillingInterval;
  },
): Promise<string> {
  const product = await stripe.products.create({
    name: input.planName,
    metadata: { planKey: input.planKey },
  });
  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: eurosToCents(input.amount),
    recurring: { interval: input.interval === "year" ? "year" : "month" },
    product: product.id,
    metadata: { planKey: input.planKey, billingInterval: input.interval },
  });
  return price.id;
}

export function subscriptionItemPeriodUnix(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as
    | { current_period_start?: number; current_period_end?: number }
    | undefined;
  const start = item?.current_period_start;
  const end = item?.current_period_end;
  const endMs = stripeSubscriptionPeriodEndMs(subscription);
  return {
    periodStart: typeof start === "number" && start > 0 ? start : Math.floor(Date.now() / 1000),
    periodEnd:
      typeof end === "number" && end > 0 ? end : endMs != null ? Math.floor(endMs / 1000) : null,
  };
}

export function subscriptionBillingInterval(subscription: Stripe.Subscription): BillingInterval {
  const meta = subscription.metadata?.billingInterval;
  if (meta === "year" || meta === "month") return meta;
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === "year" ? "year" : "month";
}

export function itemAmountMatchesPlan(
  subscription: Stripe.Subscription,
  plan: PlanTier,
  intervalHint?: BillingInterval,
): boolean {
  const item = subscription.items.data[0];
  const unit = item?.price?.unit_amount;
  if (unit == null) return false;
  const amount = unit / 100;
  const itemInterval = item?.price?.recurring?.interval;
  const interval =
    intervalHint ??
    (itemInterval === "year" ? "year" : itemInterval === "month" ? "month" : subscriptionBillingInterval(subscription));
  const expected = planAmountForInterval(plan, interval);
  return Math.abs(amount - expected) < 0.01;
}
