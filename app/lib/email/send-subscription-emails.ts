import type { BillingInterval } from "@/app/lib/billing/billing-interval";
import { parseBillingInterval } from "@/app/lib/billing/billing-interval";
import { planAmountForInterval } from "@/app/lib/billing/plan-change";
import { formatPlanPrice } from "@/app/lib/billing/format-plan-price";
import { sendTemplatedEmail } from "@/app/lib/email/send-templated";
import { absoluteUrl } from "@/app/lib/site-url";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

function periodLabel(languageCode: string, interval: BillingInterval): string {
  const lang = languageCode.trim().toLowerCase().slice(0, 2);
  if (lang === "lv") {
    return interval === "year" ? "gadā" : "mēnesī";
  }
  return interval === "year" ? "per year" : "per month";
}

function formatEmailDate(iso: string, languageCode: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  const d = new Date(ms);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  if (languageCode.trim().toLowerCase().startsWith("lv")) {
    return `${day}.${month}.${year}.`;
  }
  return `${year}-${month}-${day}`;
}

async function loadRecipient(userId: string) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("email, name, language_code")
    .eq("id", userId)
    .maybeSingle();
  const email = (data?.email as string | undefined)?.trim().toLowerCase() ?? "";
  if (!email) return null;
  return {
    email,
    name: (data?.name as string | undefined)?.trim() || email.split("@")[0] || email,
    languageCode: (data?.language_code as string | undefined)?.trim() || "lv",
  };
}

async function loadPlanEmailFields(
  planKey: string,
  languageCode: string,
  interval: BillingInterval,
) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("id, plan_key, price_amount, price_amount_annual, sort_order, is_active")
    .eq("plan_key", planKey.trim().toLowerCase())
    .maybeSingle();
  if (!plan?.is_active) return null;
  const planId = plan.id as string;
  const { data: i18n } = await admin
    .from("subscription_plan_i18n")
    .select("language_code, name")
    .eq("plan_id", planId);
  const names = new Map((i18n ?? []).map((row) => [row.language_code as string, row.name as string]));
  const displayName =
    names.get(languageCode)?.trim() ||
    names.get("en")?.trim() ||
    names.get("lv")?.trim() ||
    String(plan.plan_key);
  const tier = {
    planKey: String(plan.plan_key),
    sortOrder: Number(plan.sort_order) || 0,
    priceAmount: Number(plan.price_amount) || 0,
    priceAmountAnnual: Number(plan.price_amount_annual) || 0,
  };
  const amount = planAmountForInterval(tier, interval);
  return {
    plan: displayName,
    price: formatPlanPrice(amount),
    period: periodLabel(languageCode, interval),
  };
}

async function sendBillingEmail(
  kind: "subscription_purchased" | "subscription_plan_upgraded" | "subscription_plan_downgraded",
  userId: string,
  params: {
    planKey: string;
    billingInterval: BillingInterval;
    previousPlanKey?: string | null;
    effectiveAt?: string | null;
  },
) {
  const recipient = await loadRecipient(userId);
  if (!recipient) return;
  const interval = parseBillingInterval(params.billingInterval);
  const planFields = await loadPlanEmailFields(params.planKey, recipient.languageCode, interval);
  if (!planFields) return;

  let previousPlan = "—";
  if (params.previousPlanKey) {
    const prev = await loadPlanEmailFields(params.previousPlanKey, recipient.languageCode, interval);
    previousPlan = prev?.plan ?? params.previousPlanKey;
  }

  const effectiveDate = params.effectiveAt
    ? formatEmailDate(params.effectiveAt, recipient.languageCode)
    : "—";

  await sendTemplatedEmail({
    kind,
    to: recipient.email,
    languageCode: recipient.languageCode,
    params: {
      name: recipient.name,
      link: absoluteUrl("/studio"),
      plan: planFields.plan,
      previous_plan: previousPlan,
      price: planFields.price,
      period: planFields.period,
      effective_date: effectiveDate,
    },
  });
}

export function notifySubscriptionPurchasedEmail(
  userId: string,
  planKey: string,
  billingInterval: BillingInterval,
) {
  void sendBillingEmail("subscription_purchased", userId, {
    planKey,
    billingInterval,
  }).catch((error) => {
    console.error(
      "notifySubscriptionPurchasedEmail failed",
      error instanceof Error ? error.message : error,
    );
  });
}

export function notifySubscriptionPlanUpgradedEmail(
  userId: string,
  input: {
    planKey: string;
    previousPlanKey: string;
    billingInterval: BillingInterval;
  },
) {
  void sendBillingEmail("subscription_plan_upgraded", userId, {
    planKey: input.planKey,
    previousPlanKey: input.previousPlanKey,
    billingInterval: input.billingInterval,
  }).catch((error) => {
    console.error(
      "notifySubscriptionPlanUpgradedEmail failed",
      error instanceof Error ? error.message : error,
    );
  });
}

export function notifySubscriptionPlanDowngradedEmail(
  userId: string,
  input: {
    planKey: string;
    previousPlanKey: string;
    billingInterval: BillingInterval;
    effectiveAt: string;
  },
) {
  void sendBillingEmail("subscription_plan_downgraded", userId, {
    planKey: input.planKey,
    previousPlanKey: input.previousPlanKey,
    billingInterval: input.billingInterval,
    effectiveAt: input.effectiveAt,
  }).catch((error) => {
    console.error(
      "notifySubscriptionPlanDowngradedEmail failed",
      error instanceof Error ? error.message : error,
    );
  });
}
