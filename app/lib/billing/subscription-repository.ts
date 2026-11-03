import type Stripe from "stripe";
import { eurosToCents } from "@/app/lib/billing/format-plan-price";
import {
  isSubscriptionAccessActive,
  stripeSubscriptionPeriodEndMs,
  type UserSubscriptionRow,
} from "@/app/lib/billing/subscription-access";
import { getStripeClient, isStripeIntegrationReady } from "@/app/lib/billing/stripe-server";
import { getPublicSiteUrl } from "@/app/lib/site-url";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type PlanRow = {
  id: string;
  plan_key: string;
  price_amount: number | string;
  is_active: boolean;
};

function parseAmount(value: number | string) {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export async function isModulePaidPlansEnabledServer(): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_frontend_modules")
    .select("is_enabled")
    .eq("module_key", "module_paid_plans")
    .maybeSingle();
  return data?.is_enabled === true;
}

export async function loadUserSubscriptionRow(userId: string): Promise<UserSubscriptionRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_subscriptions")
    .select(
      "user_id, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserSubscriptionRow;
}

export async function userHasActivePaidSubscription(userId: string, nowMs: number = Date.now()) {
  const row = await loadUserSubscriptionRow(userId);
  return isSubscriptionAccessActive(row, nowMs);
}

async function loadPlanByKey(planKey: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscription_plans")
    .select("id, plan_key, price_amount, is_active")
    .eq("plan_key", planKey.trim().toLowerCase())
    .maybeSingle();
  if (!data || !(data as PlanRow).is_active) return null;
  return data as PlanRow;
}

async function loadPlanName(planId: string, languageCode: string) {
  const admin = createAdminClient();
  const { data: i18n } = await admin
    .from("subscription_plan_i18n")
    .select("language_code, name")
    .eq("plan_id", planId);
  const names = new Map((i18n ?? []).map((row) => [row.language_code as string, row.name as string]));
  return (
    names.get(languageCode)?.trim() ||
    names.get("en")?.trim() ||
    names.get("lv")?.trim() ||
    null
  );
}

export async function loadUserSubscriptionDetails(userId: string, languageCode: string) {
  const row = await loadUserSubscriptionRow(userId);
  if (!row) return { row: null, planKey: null, planName: null };
  let planKey: string | null = null;
  let planName: string | null = null;
  if (row.plan_id) {
    const admin = createAdminClient();
    const { data: plan } = await admin
      .from("subscription_plans")
      .select("plan_key")
      .eq("id", row.plan_id)
      .maybeSingle();
    planKey = (plan?.plan_key as string) ?? null;
    planName = planKey ? await loadPlanName(row.plan_id, languageCode) : null;
  }
  return { row, planKey, planName: planName ?? planKey };
}

export async function listPublicBillingPlans(languageCode: string) {
  if (!(await isStripeIntegrationReady())) return [];
  const admin = createAdminClient();
  const { data: plans, error } = await admin
    .from("subscription_plans")
    .select("id, plan_key, price_amount, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("plan_key", { ascending: true });
  if (error) throw error;
  const { data: i18nRows } = await admin.from("subscription_plan_i18n").select("plan_id, language_code, name");
  const namesByPlan = new Map<string, Record<string, string>>();
  for (const row of i18nRows ?? []) {
    const planId = row.plan_id as string;
    const bucket = namesByPlan.get(planId) ?? {};
    bucket[row.language_code as string] = row.name as string;
    namesByPlan.set(planId, bucket);
  }
  return (plans ?? []).map((row) => {
    const plan = row as unknown as PlanRow;
    const names = namesByPlan.get(plan.id) ?? {};
    const name =
      names[languageCode]?.trim() ||
      names.en?.trim() ||
      names.lv?.trim() ||
      plan.plan_key;
    return {
      planKey: plan.plan_key,
      priceAmount: parseAmount(plan.price_amount),
      name,
    };
  });
}

function periodEndIso(subscription: Stripe.Subscription) {
  const ms = stripeSubscriptionPeriodEndMs(subscription);
  return ms != null ? new Date(ms).toISOString() : null;
}

export async function upsertUserSubscriptionFromStripe(
  userId: string,
  subscription: Stripe.Subscription,
  planId: string | null,
) {
  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? "";
  const patch = {
    user_id: userId,
    plan_id: planId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_end: periodEndIso(subscription),
    cancel_at_period_end: subscription.cancel_at_period_end === true,
  };
  const { error } = await admin.from("user_subscriptions").upsert(patch, { onConflict: "user_id" });
  if (error) throw error;
}

export async function syncSubscriptionById(subscriptionId: string, userIdHint?: string) {
  const stripe = await getStripeClient();
  if (!stripe) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  let userId = userIdHint || subscription.metadata.userId || "";
  if (!userId) {
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (customerId) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      userId = (data?.user_id as string) ?? "";
    }
  }
  if (!userId) return;
  const planKey = subscription.metadata.planKey?.trim().toLowerCase() ?? "";
  let planId: string | null = null;
  if (planKey) {
    const plan = await loadPlanByKey(planKey);
    planId = plan?.id ?? null;
  }
  await upsertUserSubscriptionFromStripe(userId, subscription, planId);
}

export async function findUserIdByStripeCustomer(customerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.user_id as string) ?? "";
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  planKey: string;
  languageCode: string;
}) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("stripe_unavailable");
  const plan = await loadPlanByKey(input.planKey);
  if (!plan) throw new Error("plan_not_found");
  const price = parseAmount(plan.price_amount);
  if (price <= 0) throw new Error("plan_price_invalid");

  const existing = await loadUserSubscriptionRow(input.userId);
  let customerId = existing?.stripe_customer_id?.trim() ?? "";
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = "";
    }
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.email.trim() || undefined,
      metadata: { userId: input.userId },
    });
    customerId = customer.id;
    const admin = createAdminClient();
    await admin.from("user_subscriptions").upsert(
      {
        user_id: input.userId,
        stripe_customer_id: customerId,
        status: "none",
      },
      { onConflict: "user_id" },
    );
  }

  const planName = (await loadPlanName(plan.id, input.languageCode)) ?? plan.plan_key;
  const site = getPublicSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: input.userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: eurosToCents(price),
          recurring: { interval: "month" },
          product_data: {
            name: planName,
            metadata: { planKey: plan.plan_key },
          },
        },
      },
    ],
    subscription_data: {
      metadata: {
        userId: input.userId,
        planKey: plan.plan_key,
      },
    },
    metadata: {
      userId: input.userId,
      planKey: plan.plan_key,
    },
    success_url: `${site}/studio?billing=success`,
    cancel_url: `${site}/studio?billing=cancel`,
  });
  if (!session.url) throw new Error("checkout_url_missing");
  return session.url;
}

export async function cancelSubscriptionAtPeriodEnd(userId: string) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("stripe_unavailable");
  const row = await loadUserSubscriptionRow(userId);
  const subId = row?.stripe_subscription_id?.trim();
  if (!subId) throw new Error("no_subscription");
  const updated = await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
  await upsertUserSubscriptionFromStripe(userId, updated, row?.plan_id ?? null);
}

export async function resumeSubscription(userId: string) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("stripe_unavailable");
  const row = await loadUserSubscriptionRow(userId);
  const subId = row?.stripe_subscription_id?.trim();
  if (!subId) throw new Error("no_subscription");
  const updated = await stripe.subscriptions.update(subId, { cancel_at_period_end: false });
  await upsertUserSubscriptionFromStripe(userId, updated, row?.plan_id ?? null);
}
