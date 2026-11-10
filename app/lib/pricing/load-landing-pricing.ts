import { openEarlyOffer, type EarlyOffer } from "@/app/lib/billing/early-offer";
import { loadGlobalEarlyOffer } from "@/app/lib/billing/subscription-repository";
import { formatPlanPrice } from "@/app/lib/billing/format-plan-price";
import { loadSubscriptionTrialPeriodDaysAdmin } from "@/app/lib/billing/trial-period";
import { isModulePaidPlansEnabledServer } from "@/app/lib/billing/subscription-repository";
import { PRICING } from "@/app/lib/pricing";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type LandingPricingPlan = {
  planKey: string;
  name: string;
  priceAmountMonthly: number;
  priceAmountAnnual: number;
  priceLabel: string;
  periodKey: "landing.pricing.period.beta" | "landing.pricing.pro.period" | "landing.pricing.period.year" | null;
  badgeKey: string;
  bodyKey: string;
  highlighted: boolean;
  showCta: boolean;
  comingSoon: boolean;
  isFreeTier: boolean;
  moduleKeys: Set<string>;
  earlyOffer: EarlyOffer | null;
};

export type LandingPricingFeature = {
  id: string;
  labelKey: string;
  includedByPlan: Record<string, boolean>;
};

export type LandingPricingData = {
  plans: LandingPricingPlan[];
  features: LandingPricingFeature[];
  paidCheckoutLive: boolean;
  trialPeriodDays: number;
};

type CompareRowDef =
  | { id: string; labelKey: string; kind: "always"; basic: boolean; pro: boolean }
  | { id: string; labelKey: string; kind: "module"; moduleKey: string };

const COMPARE_ROWS: CompareRowDef[] = [
  {
    id: "link_page",
    labelKey: "landing.pricing.compare.link_page",
    kind: "always",
    basic: true,
    pro: true,
  },
  {
    id: "blocks",
    labelKey: "landing.pricing.compare.blocks",
    kind: "always",
    basic: true,
    pro: true,
  },
  {
    id: "booking",
    labelKey: "landing.pricing.compare.booking",
    kind: "always",
    basic: true,
    pro: true,
  },
  {
    id: "contact_share",
    labelKey: "landing.pricing.compare.contact_share",
    kind: "always",
    basic: true,
    pro: true,
  },
  {
    id: "no_ads",
    labelKey: "landing.pricing.compare.no_ads",
    kind: "always",
    basic: true,
    pro: true,
  },
  {
    id: "multisites",
    labelKey: "landing.pricing.compare.multisites",
    kind: "module",
    moduleKey: "module_multisites",
  },
  {
    id: "analytics_per_page",
    labelKey: "landing.pricing.compare.analytics_per_page",
    kind: "module",
    moduleKey: "module_umami",
  },
];

/** When DB has no row yet — marketing defaults for plan-gated modules. */
const FALLBACK_MODULE_META: Record<string, { isEnabled: boolean; isPaid: boolean }> = {
  module_multisites: { isEnabled: true, isPaid: true },
  module_umami: { isEnabled: false, isPaid: false },
};

const LANDING_COMPARE_SKIP_MODULES = new Set(["module_paid_plans"]);

type FrontendModuleMeta = {
  isEnabled: boolean;
  isPaid: boolean;
};

/** Marketing default when admin has not assigned modules to a plan yet. */
const DEFAULT_PLAN_MODULES: Record<string, string[]> = {
  basic: [],
  pro: ["module_umami", "module_multisites"],
};

function resolveModuleMeta(
  moduleKey: string,
  metaByModuleKey: Map<string, FrontendModuleMeta>,
): FrontendModuleMeta {
  const fromDb = metaByModuleKey.get(moduleKey);
  if (fromDb) {
    return fromDb;
  }
  return FALLBACK_MODULE_META[moduleKey] ?? { isEnabled: false, isPaid: false };
}

function planIncludesModule(plan: LandingPricingPlan, moduleKey: string): boolean {
  if (plan.moduleKeys.size > 0) {
    return plan.moduleKeys.has(moduleKey);
  }
  return (DEFAULT_PLAN_MODULES[plan.planKey] ?? []).includes(moduleKey);
}

function moduleIncludedForPlan(
  plan: LandingPricingPlan,
  moduleKey: string,
  meta: FrontendModuleMeta,
  paidCheckoutLive: boolean,
): boolean {
  const planGated = meta.isPaid && paidCheckoutLive;
  if (!planGated) {
    return true;
  }
  return planIncludesModule(plan, moduleKey);
}

async function loadFrontendModuleMetaByKey(): Promise<Map<string, FrontendModuleMeta>> {
  const metaByModuleKey = new Map<string, FrontendModuleMeta>();
  if (!isSupabaseAdminConfigured()) {
    return metaByModuleKey;
  }
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_frontend_modules")
      .select("module_key, is_enabled, is_paid");
    for (const row of data ?? []) {
      metaByModuleKey.set(String(row.module_key), {
        isEnabled: row.is_enabled === true,
        isPaid: row.is_paid === true,
      });
    }
  } catch {
    /* use FALLBACK_MODULE_META per key */
  }
  return metaByModuleKey;
}

function fallbackPlans(paidCheckoutLive: boolean): LandingPricingPlan[] {
  return [
    {
      planKey: "basic",
      name: "Basic",
      priceAmountMonthly: 0,
      priceAmountAnnual: 0,
      priceLabel: PRICING.free.priceLabel,
      periodKey: null,
      badgeKey: "landing.pricing.free.badge",
      bodyKey: "landing.pricing.free.body",
      highlighted: true,
      showCta: true,
      comingSoon: false,
      isFreeTier: true,
      moduleKeys: new Set(),
      earlyOffer: null,
    },
    {
      planKey: "pro",
      name: "Pro",
      priceAmountMonthly: 0,
      priceAmountAnnual: 0,
      priceLabel: PRICING.pro.priceLabel,
      periodKey: "landing.pricing.pro.period",
      badgeKey: "landing.pricing.pro.badge",
      bodyKey: "landing.pricing.pro.body",
      highlighted: false,
      showCta: paidCheckoutLive,
      comingSoon: !paidCheckoutLive,
      isFreeTier: false,
      moduleKeys: new Set(DEFAULT_PLAN_MODULES.pro),
      earlyOffer: null,
    },
  ];
}

function resolvePlanName(names: Record<string, string>, languageCode: string, planKey: string) {
  return (
    names[languageCode]?.trim() ||
    names.en?.trim() ||
    names.lv?.trim() ||
    planKey
  );
}

export async function loadLandingPricing(languageCode: string): Promise<LandingPricingData> {
  const [paidCheckoutLive, metaByModuleKey, trialPeriodDays] = await Promise.all([
    isModulePaidPlansEnabledServer(),
    loadFrontendModuleMetaByKey(),
    loadSubscriptionTrialPeriodDaysAdmin(),
  ]);
  let plans = fallbackPlans(paidCheckoutLive);

  if (isSupabaseAdminConfigured()) {
    try {
      const admin = createAdminClient();
      const [{ data: planRows }, early] = await Promise.all([
        admin
          .from("subscription_plans")
          .select("id, plan_key, price_amount, price_amount_annual, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("plan_key", { ascending: true }),
        loadGlobalEarlyOffer(),
      ]);

      if (planRows && planRows.length > 0) {
        const planIds = planRows.map((row) => row.id as string);
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
          const code = row.language_code as string;
          const bucket = namesByPlan.get(planId) ?? {};
          bucket[code] = row.name as string;
          namesByPlan.set(planId, bucket);
        }
        const earlyNote =
          early.notes[languageCode]?.trim() || early.notes.en?.trim() || early.notes.lv?.trim() || "";

        const modulesByPlan = new Map<string, Set<string>>();
        for (const row of moduleRows ?? []) {
          const planId = row.plan_id as string;
          const set = modulesByPlan.get(planId) ?? new Set<string>();
          set.add(row.module_key as string);
          modulesByPlan.set(planId, set);
        }

        plans = planRows.map((row, index) => {
          const planKey = String(row.plan_key);
          const amount = Number(row.price_amount);
          const amountAnnual = Number(row.price_amount_annual);
          const isPro = planKey === "pro";
          const isFreeTier = planKey === "basic" || (!isPro && amount <= 0 && amountAnnual <= 0);
          const hasMonthlyPrice = amount > 0;
          let priceLabel: string = PRICING.free.priceLabel;
          if (hasMonthlyPrice) {
            priceLabel = formatPlanPrice(amount).replace("€ ", "€");
          } else if (isPro) {
            priceLabel = PRICING.pro.priceLabel;
          }
          const paidPlan = hasMonthlyPrice || amountAnnual > 0;
          return {
            planKey,
            name: resolvePlanName(namesByPlan.get(row.id as string) ?? {}, languageCode, planKey),
            priceAmountMonthly: amount,
            priceAmountAnnual: amountAnnual,
            priceLabel,
            periodKey: paidPlan ? ("landing.pricing.pro.period" as const) : null,
            badgeKey: isPro ? "landing.pricing.pro.badge" : "landing.pricing.free.badge",
            bodyKey: isPro ? "landing.pricing.pro.body" : "landing.pricing.free.body",
            highlighted: index === 0,
            showCta: isPro ? paidCheckoutLive && paidPlan : true,
            comingSoon: isPro && (!paidCheckoutLive || !paidPlan),
            isFreeTier,
            moduleKeys: modulesByPlan.get(row.id as string) ?? new Set(),
            earlyOffer: paidPlan
              ? openEarlyOffer({
                  enabled: early.enabled,
                  users: early.users,
                  months: early.months,
                  claimed: early.claimed,
                  extendable: early.extendable,
                  note: earlyNote,
                })
              : null,
          };
        });
      }
    } catch {
      plans = fallbackPlans(paidCheckoutLive);
    }
  }

  const features: LandingPricingFeature[] = COMPARE_ROWS.filter((row) => {
    if (row.kind !== "module") {
      return true;
    }
    if (LANDING_COMPARE_SKIP_MODULES.has(row.moduleKey)) {
      return false;
    }
    return resolveModuleMeta(row.moduleKey, metaByModuleKey).isEnabled;
  }).map((row) => {
    const includedByPlan: Record<string, boolean> = {};
    const moduleMeta = row.kind === "module" ? resolveModuleMeta(row.moduleKey, metaByModuleKey) : null;
    for (const plan of plans) {
      if (row.kind === "always") {
        const fallback = plan.planKey === "pro" ? row.pro : row.basic;
        includedByPlan[plan.planKey] = fallback;
      } else {
        includedByPlan[plan.planKey] = moduleIncludedForPlan(
          plan,
          row.moduleKey,
          moduleMeta!,
          paidCheckoutLive,
        );
      }
    }
    return { id: row.id, labelKey: row.labelKey, includedByPlan };
  });

  return { plans, features, paidCheckoutLive, trialPeriodDays };
}
