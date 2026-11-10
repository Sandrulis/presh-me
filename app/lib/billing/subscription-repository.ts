import type Stripe from "stripe";
import type { ActivePlanLabel } from "@/app/lib/billing/plan-label-types";
export type { ActivePlanLabel } from "@/app/lib/billing/plan-label-types";
export { resolvePlanBadgeLabelForModule } from "@/app/lib/billing/plan-label-types";
import { eurosToCents } from "@/app/lib/billing/format-plan-price";
import {
  comparePlanChange,
  createStripePriceForPlan,
  itemAmountMatchesPlan,
  planAmountForInterval,
  subscriptionBillingInterval,
  subscriptionItemPeriodUnix,
  type PlanTier,
} from "@/app/lib/billing/plan-change";
import { parseBillingInterval, type BillingInterval } from "@/app/lib/billing/billing-interval";
import { openEarlyOffer, trialEndUnixAfterMonths } from "@/app/lib/billing/early-offer";
import { loadSubscriptionTrialPeriodDaysAdmin } from "@/app/lib/billing/trial-period";
import {
  notifySubscriptionPlanDowngradedEmail,
  notifySubscriptionPlanUpgradedEmail,
} from "@/app/lib/email/send-subscription-emails";
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
  price_amount_annual: number | string;
  sort_order: number;
  is_active: boolean;
};

function planRowToTier(row: PlanRow): PlanTier {
  return {
    planKey: row.plan_key,
    sortOrder: row.sort_order,
    priceAmount: parseAmount(row.price_amount),
    priceAmountAnnual: parseAmount(row.price_amount_annual),
  };
}

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
      "user_id, plan_id, pending_plan_id, pending_plan_effective_at, billing_interval, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end",
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
    .select("id, plan_key, price_amount, price_amount_annual, sort_order, is_active")
    .eq("plan_key", planKey.trim().toLowerCase())
    .maybeSingle();
  if (!data || !(data as PlanRow).is_active) return null;
  return data as PlanRow;
}

async function loadPlanKeyById(planId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("subscription_plans").select("plan_key").eq("id", planId).maybeSingle();
  return (data?.plan_key as string) ?? null;
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
  if (!row) {
    return {
      row: null,
      planKey: null,
      planName: null,
      pendingPlanKey: null,
      pendingPlanName: null,
    };
  }
  let planKey: string | null = null;
  let planName: string | null = null;
  if (row.plan_id) {
    planKey = await loadPlanKeyById(row.plan_id);
    planName = planKey ? await loadPlanName(row.plan_id, languageCode) : null;
  }
  let pendingPlanKey: string | null = null;
  let pendingPlanName: string | null = null;
  if (row.pending_plan_id) {
    pendingPlanKey = await loadPlanKeyById(row.pending_plan_id);
    pendingPlanName = pendingPlanKey
      ? await loadPlanName(row.pending_plan_id, languageCode)
      : null;
  }
  return { row, planKey, planName: planName ?? planKey, pendingPlanKey, pendingPlanName };
}

export async function listPublicBillingPlans(languageCode: string) {
  if (!(await isStripeIntegrationReady())) return [];
  const admin = createAdminClient();
  const { data: plans, error } = await admin
    .from("subscription_plans")
    .select("id, plan_key, price_amount, price_amount_annual, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("plan_key", { ascending: true });
  if (error) throw error;
  const [i18nRes, early] = await Promise.all([
    admin.from("subscription_plan_i18n").select("plan_id, language_code, name"),
    loadGlobalEarlyOffer(),
  ]);
  const namesByPlan = new Map<string, Record<string, string>>();
  for (const row of i18nRes.data ?? []) {
    const planId = row.plan_id as string;
    const names = namesByPlan.get(planId) ?? {};
    names[row.language_code as string] = row.name as string;
    namesByPlan.set(planId, names);
  }
  const note =
    early.notes[languageCode]?.trim() || early.notes.en?.trim() || early.notes.lv?.trim() || "";
  return (plans ?? []).map((row) => {
    const plan = row as unknown as PlanRow;
    const names = namesByPlan.get(plan.id) ?? {};
    const name =
      names[languageCode]?.trim() ||
      names.en?.trim() ||
      names.lv?.trim() ||
      plan.plan_key;
    const priceAmount = parseAmount(plan.price_amount);
    const priceAmountAnnual = parseAmount(plan.price_amount_annual);
    return {
      planKey: plan.plan_key,
      priceAmount,
      priceAmountAnnual,
      sortOrder: (row as { sort_order?: number }).sort_order ?? 0,
      name,
      earlyOffer:
        priceAmount > 0 || priceAmountAnnual > 0
          ? openEarlyOffer({
              enabled: early.enabled,
              users: early.users,
              months: early.months,
              claimed: early.claimed,
              extendable: early.extendable,
              note,
            })
          : null,
    };
  });
}

export async function loadGlobalEarlyOffer() {
  const empty = {
    enabled: false,
    users: 0,
    months: 0,
    claimed: 0,
    extendable: false,
    notes: {} as Record<string, string>,
  };
  if (!isSupabaseAdminConfigured()) return empty;
  try {
    const admin = createAdminClient();
    const [offerRes, claimsRes, notesRes] = await Promise.all([
      admin
        .from("subscription_early_offer")
        .select("is_enabled, user_limit, free_months, extendable")
        .eq("id", 1)
        .maybeSingle(),
      admin.from("subscription_early_claims").select("user_id", { count: "exact", head: true }),
      admin.from("subscription_early_offer_i18n").select("language_code, note"),
    ]);
    if (offerRes.error) return empty;
    const notes: Record<string, string> = {};
    for (const row of notesRes.data ?? []) {
      notes[row.language_code as string] = (row.note as string) ?? "";
    }
    return {
      enabled: offerRes.data?.is_enabled === true,
      users: parseAmount(offerRes.data?.user_limit ?? 0),
      months: parseAmount(offerRes.data?.free_months ?? 0),
      claimed: claimsRes.count ?? 0,
      extendable: offerRes.data?.extendable === true,
      notes,
    };
  } catch {
    return empty;
  }
}

/** Active plan display names and included modules (no Stripe gate — studio badges, marketing). */
export async function listActiveSubscriptionPlanLabels(languageCode: string): Promise<ActivePlanLabel[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data: plans, error } = await admin
    .from("subscription_plans")
    .select("id, plan_key, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("plan_key", { ascending: true });
  if (error || !plans?.length) return [];

  const planIds = plans.map((row) => row.id as string);
  const { data: i18nRows } = await admin
    .from("subscription_plan_i18n")
    .select("plan_id, language_code, name")
    .in("plan_id", planIds);
  const { data: moduleRows } = await admin
    .from("subscription_plan_modules")
    .select("plan_id, module_key")
    .in("plan_id", planIds);

  const namesByPlan = new Map<string, Record<string, string>>();
  for (const row of i18nRows ?? []) {
    const planId = row.plan_id as string;
    const bucket = namesByPlan.get(planId) ?? {};
    bucket[row.language_code as string] = row.name as string;
    namesByPlan.set(planId, bucket);
  }

  const modulesByPlan = new Map<string, string[]>();
  for (const row of moduleRows ?? []) {
    const planId = row.plan_id as string;
    const list = modulesByPlan.get(planId) ?? [];
    list.push(row.module_key as string);
    modulesByPlan.set(planId, list);
  }

  return plans.map((row) => {
    const planId = row.id as string;
    const planKey = String(row.plan_key);
    const names = namesByPlan.get(planId) ?? {};
    const name =
      names[languageCode]?.trim() ||
      names.en?.trim() ||
      names.lv?.trim() ||
      planKey;
    return {
      planKey,
      name,
      moduleKeys: modulesByPlan.get(planId) ?? [],
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
  patch: {
    planId: string | null;
    pendingPlanId?: string | null;
    pendingPlanEffectiveAt?: string | null;
    billingInterval?: BillingInterval;
  },
) {
  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? "";
  const row = {
    user_id: userId,
    plan_id: patch.planId,
    pending_plan_id: patch.pendingPlanId ?? null,
    pending_plan_effective_at: patch.pendingPlanEffectiveAt ?? null,
    billing_interval: patch.billingInterval ?? subscriptionBillingInterval(subscription),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_end: periodEndIso(subscription),
    cancel_at_period_end: subscription.cancel_at_period_end === true,
  };
  const { error } = await admin.from("user_subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}

async function resolveAccessFromStripeSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<{
  planId: string | null;
  pendingPlanId: string | null;
  pendingPlanEffectiveAt: string | null;
  billingInterval: BillingInterval;
}> {
  const metaPlanKey = subscription.metadata?.planKey?.trim().toLowerCase() ?? "";
  const pendingPlanKey = subscription.metadata?.pendingPlanKey?.trim().toLowerCase() ?? "";
  const billingInterval = subscriptionBillingInterval(subscription);
  const currentPlan = metaPlanKey ? await loadPlanByKey(metaPlanKey) : null;
  const pendingPlan = pendingPlanKey ? await loadPlanByKey(pendingPlanKey) : null;

  if (pendingPlan && currentPlan && itemAmountMatchesPlan(subscription, planRowToTier(pendingPlan), billingInterval)) {
    await stripe.subscriptions.update(subscription.id, {
      metadata: {
        ...subscription.metadata,
        planKey: pendingPlanKey,
        pendingPlanKey: "",
        pendingEffectiveAt: "",
        billingInterval,
      },
    });
    return {
      planId: pendingPlan.id,
      pendingPlanId: null,
      pendingPlanEffectiveAt: null,
      billingInterval,
    };
  }

  if (pendingPlan && currentPlan) {
    const effectiveAt = subscription.metadata?.pendingEffectiveAt?.trim() || null;
    return {
      planId: currentPlan.id,
      pendingPlanId: pendingPlan.id,
      pendingPlanEffectiveAt: effectiveAt,
      billingInterval,
    };
  }

  if (currentPlan) {
    return {
      planId: currentPlan.id,
      pendingPlanId: null,
      pendingPlanEffectiveAt: null,
      billingInterval,
    };
  }

  const loaded = metaPlanKey ? await loadPlanByKey(metaPlanKey) : null;
  return {
    planId: loaded?.id ?? null,
    pendingPlanId: null,
    pendingPlanEffectiveAt: null,
    billingInterval,
  };
}

export async function syncSubscriptionById(subscriptionId: string, userIdHint?: string) {
  const stripe = await getStripeClient();
  if (!stripe) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  let userId = userIdHint || subscription.metadata?.userId || "";
  if (!userId) {
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (customerId) {
      userId = await findUserIdByStripeCustomer(customerId);
    }
  }
  if (!userId) return;
  const access = await resolveAccessFromStripeSubscription(stripe, subscription);
  await upsertUserSubscriptionFromStripe(userId, subscription, {
    planId: access.planId,
    pendingPlanId: access.pendingPlanId,
    pendingPlanEffectiveAt: access.pendingPlanEffectiveAt,
    billingInterval: access.billingInterval,
  });
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

async function claimGlobalEarlyMonths(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_early_offer", { p_user_id: userId });
  if (error) return 0;
  const months = typeof data === "number" ? data : Number(data);
  return Number.isFinite(months) ? Math.max(0, Math.floor(months)) : 0;
}

async function attachEarlyClaimSession(userId: string, sessionId: string) {
  const admin = createAdminClient();
  await admin
    .from("subscription_early_claims")
    .update({ stripe_session_id: sessionId })
    .eq("user_id", userId)
    .eq("status", "reserved");
}

export async function keepPlanEarlyClaim(_planKey: string, userId: string) {
  if (!userId) return;
  const admin = createAdminClient();
  await admin
    .from("subscription_early_claims")
    .update({ status: "kept" })
    .eq("user_id", userId)
    .eq("status", "reserved");
}

export async function releasePlanEarlyClaim(_planKey: string, userId: string, sessionId: string) {
  if (!userId || !sessionId) return;
  const admin = createAdminClient();
  await admin
    .from("subscription_early_claims")
    .delete()
    .eq("user_id", userId)
    .eq("status", "reserved")
    .eq("stripe_session_id", sessionId);
}

async function checkoutSubscriptionTrialDays(userId: string): Promise<number | undefined> {
  const existing = await loadUserSubscriptionRow(userId);
  if (existing?.stripe_subscription_id?.trim()) {
    return undefined;
  }
  return loadSubscriptionTrialPeriodDaysAdmin();
}

export async function extendSubscriptionWithTrialBonus(subscriptionId: string) {
  const stripe = await getStripeClient();
  if (!stripe) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.status !== "active" || subscription.trial_end != null) {
    return;
  }
  const days = await loadSubscriptionTrialPeriodDaysAdmin();
  const bonusTrialEnd = subscription.current_period_end + days * 86400;
  await stripe.subscriptions.update(subscriptionId, {
    trial_end: bonusTrialEnd,
    proration_behavior: "none",
  });
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  planKey: string;
  languageCode: string;
  billingInterval?: BillingInterval;
}) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("stripe_unavailable");
  const plan = await loadPlanByKey(input.planKey);
  if (!plan) throw new Error("plan_not_found");
  const interval = parseBillingInterval(input.billingInterval);
  const price =
    interval === "year"
      ? parseAmount(plan.price_amount_annual)
      : parseAmount(plan.price_amount);
  if (price <= 0) throw new Error("plan_price_invalid");

  const existing = await loadUserSubscriptionRow(input.userId);
  if (
    existing?.stripe_subscription_id &&
    isSubscriptionAccessActive(existing)
  ) {
    throw new Error("active_subscription");
  }

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
  const earlyMonths = await claimGlobalEarlyMonths(input.userId);
  const nowUnix = Math.floor(Date.now() / 1000);
  const trialDays = await checkoutSubscriptionTrialDays(input.userId);
  const earlyTrialEnd = earlyMonths > 0 ? trialEndUnixAfterMonths(earlyMonths) : 0;
  const dayTrialEnd = trialDays ? nowUnix + trialDays * 86400 : 0;
  const trialEnd = Math.max(earlyTrialEnd, dayTrialEnd);
  const subscriptionTrial =
    earlyMonths > 0 && trialEnd >= nowUnix + 48 * 3600
      ? { trial_end: trialEnd }
      : trialDays
        ? { trial_period_days: trialDays }
        : {};
  let session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: input.userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: eurosToCents(price),
          recurring: { interval: interval === "year" ? "year" : "month" },
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
        billingInterval: interval,
      },
      ...subscriptionTrial,
    },
    metadata: {
      userId: input.userId,
      planKey: plan.plan_key,
      billingInterval: interval,
    },
    success_url: `${site}/studio?billing=success`,
    cancel_url: `${site}/studio?billing=cancel`,
  });
  } catch (error) {
    if (earlyMonths > 0) {
      const admin = createAdminClient();
      await admin
        .from("subscription_early_claims")
        .delete()
        .eq("user_id", input.userId)
        .eq("status", "reserved")
        .eq("stripe_session_id", "");
    }
    throw error;
  }
  if (!session.url) throw new Error("checkout_url_missing");
  if (earlyMonths > 0 && session.id) {
    await attachEarlyClaimSession(input.userId, session.id);
  }
  return session.url;
}

export type ChangePlanResult = {
  change: "upgrade" | "downgrade";
  effectiveAt: string | null;
};

export async function changeSubscriptionPlan(input: {
  userId: string;
  planKey: string;
  languageCode: string;
  billingInterval?: BillingInterval;
}): Promise<ChangePlanResult> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("stripe_unavailable");

  const targetPlan = await loadPlanByKey(input.planKey);
  if (!targetPlan) throw new Error("plan_not_found");
  const targetInterval = parseBillingInterval(input.billingInterval);
  const targetAmount = planAmountForInterval(planRowToTier(targetPlan), targetInterval);
  if (targetAmount <= 0) throw new Error("plan_price_invalid");

  const row = await loadUserSubscriptionRow(input.userId);
  const subId = row?.stripe_subscription_id?.trim();
  if (!row || !subId || !isSubscriptionAccessActive(row)) {
    throw new Error("no_active_subscription");
  }

  const subscription = await stripe.subscriptions.retrieve(subId);
  const currentKey = row.plan_id ? await loadPlanKeyById(row.plan_id) : subscription.metadata?.planKey;
  const currentPlan = currentKey ? await loadPlanByKey(currentKey) : null;
  if (!currentPlan) throw new Error("current_plan_unknown");

  const currentInterval = parseBillingInterval(row.billing_interval || subscriptionBillingInterval(subscription));
  const direction = comparePlanChange(
    planRowToTier(currentPlan),
    planRowToTier(targetPlan),
    currentInterval,
    targetInterval,
  );
  if (direction === "same") throw new Error("same_plan");

  const planName = (await loadPlanName(targetPlan.id, input.languageCode)) ?? targetPlan.plan_key;
  const newPriceId = await createStripePriceForPlan(stripe, {
    planKey: targetPlan.plan_key,
    planName,
    amount: targetAmount,
    interval: targetInterval,
  });

  const itemId = subscription.items.data[0]?.id;
  if (!itemId) throw new Error("subscription_item_missing");

  const existingScheduleId =
    typeof subscription.schedule === "string"
      ? subscription.schedule
      : subscription.schedule?.id ?? null;
  if (existingScheduleId) {
    await stripe.subscriptionSchedules.release(existingScheduleId);
  }

  if (direction === "upgrade") {
    const subscriptionAfter = await stripe.subscriptions.retrieve(subId);
    const liveItemId = subscriptionAfter.items.data[0]?.id ?? itemId;
    const updated = await stripe.subscriptions.update(subId, {
      items: [{ id: liveItemId, price: newPriceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: {
        ...subscription.metadata,
        userId: input.userId,
        planKey: targetPlan.plan_key,
        pendingPlanKey: "",
        pendingEffectiveAt: "",
        billingInterval: targetInterval,
      },
    });
    await upsertUserSubscriptionFromStripe(input.userId, updated, {
      planId: targetPlan.id,
      pendingPlanId: null,
      pendingPlanEffectiveAt: null,
      billingInterval: targetInterval,
    });
    notifySubscriptionPlanUpgradedEmail(input.userId, {
      planKey: targetPlan.plan_key,
      previousPlanKey: currentPlan.plan_key,
      billingInterval: targetInterval,
    });
    return { change: "upgrade", effectiveAt: null };
  }

  const { periodEnd } = subscriptionItemPeriodUnix(subscription);
  if (periodEnd == null) throw new Error("period_end_unknown");

  if (subscription.cancel_at_period_end) {
    await stripe.subscriptions.update(subId, { cancel_at_period_end: false });
  }

  const subFresh = await stripe.subscriptions.retrieve(subId);
  const item = subFresh.items.data[0] as
    | { current_period_start?: number; current_period_end?: number; price: Stripe.SubscriptionItem["price"] }
    | undefined;
  if (!item) throw new Error("subscription_item_missing");
  const periodEndUnix = item.current_period_end;
  if (!periodEndUnix) throw new Error("period_end_unknown");
  const currentPriceId =
    typeof item.price === "string" ? item.price : item.price.id;

  const schedule = await stripe.subscriptionSchedules.create({ from_subscription: subId });
  const phaseStart = schedule.phases[0]?.start_date ?? item.current_period_start ?? periodEndUnix;

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        start_date: phaseStart,
        end_date: periodEndUnix,
        items: [{ price: currentPriceId, quantity: 1 }],
      },
      {
        start_date: periodEndUnix,
        items: [{ price: newPriceId, quantity: 1 }],
      },
    ],
  });

  const effectiveIso = new Date(periodEndUnix * 1000).toISOString();

  const finalSub = await stripe.subscriptions.retrieve(subId);
  try {
    await stripe.subscriptions.update(subId, {
      metadata: {
        ...finalSub.metadata,
        userId: input.userId,
        planKey: currentPlan.plan_key,
        pendingPlanKey: targetPlan.plan_key,
        pendingEffectiveAt: effectiveIso,
        billingInterval: currentInterval,
      },
    });
  } catch {
    // Schedule holds the price change; DB pending fields still apply.
  }

  const syncedSub = await stripe.subscriptions.retrieve(subId);
  await upsertUserSubscriptionFromStripe(input.userId, syncedSub, {
    planId: currentPlan.id,
    pendingPlanId: targetPlan.id,
    pendingPlanEffectiveAt: effectiveIso,
    billingInterval: currentInterval,
  });

  notifySubscriptionPlanDowngradedEmail(input.userId, {
    planKey: targetPlan.plan_key,
    previousPlanKey: currentPlan.plan_key,
    billingInterval: targetInterval,
    effectiveAt: effectiveIso,
  });

  return { change: "downgrade", effectiveAt: effectiveIso };
}

function subscriptionScheduleId(subscription: Stripe.Subscription): string | null {
  return typeof subscription.schedule === "string"
    ? subscription.schedule
    : subscription.schedule?.id ?? null;
}

/** Stripe rejects cancel_at_period_end when a subscription schedule is attached (e.g. pending downgrade). */
async function subscriptionAfterReleasingSchedule(stripe: Stripe, subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const scheduleId = subscriptionScheduleId(subscription);
  if (!scheduleId) return subscription;
  await stripe.subscriptionSchedules.release(scheduleId);
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscriptionAtPeriodEnd(userId: string) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("stripe_unavailable");
  const row = await loadUserSubscriptionRow(userId);
  const subId = row?.stripe_subscription_id?.trim();
  if (!subId) throw new Error("no_subscription");
  const subscription = await subscriptionAfterReleasingSchedule(stripe, subId);
  const updated = await stripe.subscriptions.update(subId, {
    cancel_at_period_end: true,
    metadata: {
      ...subscription.metadata,
      pendingPlanKey: "",
      pendingEffectiveAt: "",
    },
  });
  await upsertUserSubscriptionFromStripe(userId, updated, {
    planId: row?.plan_id ?? null,
    pendingPlanId: null,
    pendingPlanEffectiveAt: null,
    billingInterval: parseBillingInterval(row?.billing_interval),
  });
}

export async function resumeSubscription(userId: string) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("stripe_unavailable");
  const row = await loadUserSubscriptionRow(userId);
  const subId = row?.stripe_subscription_id?.trim();
  if (!subId) throw new Error("no_subscription");
  const updated = await stripe.subscriptions.update(subId, { cancel_at_period_end: false });
  await upsertUserSubscriptionFromStripe(userId, updated, {
    planId: row?.plan_id ?? null,
    pendingPlanId: row?.pending_plan_id ?? null,
    pendingPlanEffectiveAt: row?.pending_plan_effective_at ?? null,
    billingInterval: parseBillingInterval(row?.billing_interval),
  });
}
