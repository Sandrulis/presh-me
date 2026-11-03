import type Stripe from "stripe";

export type UserSubscriptionRow = {
  user_id: string;
  plan_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type UserSubscriptionView = {
  planKey: string | null;
  planName: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  stripeSubscriptionId: string | null;
};

const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

export function subscriptionPeriodEndMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

export function stripeSubscriptionPeriodEndMs(subscription: Stripe.Subscription): number | null {
  const item = subscription.items.data[0] as { current_period_end?: number } | undefined;
  const fromItem = item?.current_period_end;
  const fromSub = (subscription as { current_period_end?: number }).current_period_end;
  const unix = fromItem ?? fromSub;
  return typeof unix === "number" && unix > 0 ? unix * 1000 : null;
}

export function isSubscriptionAccessActive(
  row: Pick<UserSubscriptionRow, "status" | "current_period_end"> | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!row) return false;
  if (!PAID_STATUSES.has(row.status)) return false;
  const endMs = subscriptionPeriodEndMs(row.current_period_end);
  if (endMs == null) return row.status === "active" || row.status === "trialing";
  return endMs > nowMs;
}

export function mapSubscriptionView(
  row: UserSubscriptionRow | null,
  planKey: string | null,
  planName: string | null,
): UserSubscriptionView | null {
  if (!row) return null;
  if (!row.stripe_subscription_id && row.status === "none") return null;
  return {
    planKey,
    planName,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    hasStripeCustomer: Boolean(row.stripe_customer_id?.trim()),
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

export function subscriptionUiPhase(
  view: UserSubscriptionView | null,
  nowMs: number = Date.now(),
): "none" | "active" | "canceling" | "ended" {
  if (!view) return "none";
  if (
    isSubscriptionAccessActive(
      { status: view.status, current_period_end: view.currentPeriodEnd },
      nowMs,
    )
  ) {
    return view.cancelAtPeriodEnd ? "canceling" : "active";
  }
  if (view.stripeSubscriptionId || view.hasStripeCustomer) return "ended";
  return "none";
}
