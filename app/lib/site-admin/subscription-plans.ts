"use client";

import { createClient } from "@/app/lib/supabase/client";

export type SubscriptionPlan = {
  id: string;
  planKey: string;
  priceAmount: number;
  priceAmountAnnual: number;
  sortOrder: number;
  isActive: boolean;
  names: Record<string, string>;
  moduleKeys: string[];
};

type PlanRow = {
  id: string;
  plan_key: string;
  price_amount: number | string;
  price_amount_annual: number | string;
  sort_order: number;
  is_active: boolean;
};

function parseAmount(value: number | string) {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = createClient();
  const [plansRes, i18nRes, modulesRes] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("id, plan_key, price_amount, price_amount_annual, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("plan_key", { ascending: true }),
    supabase.from("subscription_plan_i18n").select("plan_id, language_code, name"),
    supabase.from("subscription_plan_modules").select("plan_id, module_key"),
  ]);
  if (plansRes.error) throw plansRes.error;
  if (i18nRes.error) throw i18nRes.error;
  if (modulesRes.error) throw modulesRes.error;

  const namesByPlan = new Map<string, Record<string, string>>();
  for (const row of i18nRes.data ?? []) {
    const planId = row.plan_id as string;
    const code = row.language_code as string;
    const name = (row.name as string) ?? "";
    const names = namesByPlan.get(planId) ?? {};
    names[code] = name;
    namesByPlan.set(planId, names);
  }

  const modulesByPlan = new Map<string, string[]>();
  for (const row of modulesRes.data ?? []) {
    const planId = row.plan_id as string;
    const key = row.module_key as string;
    const list = modulesByPlan.get(planId) ?? [];
    list.push(key);
    modulesByPlan.set(planId, list);
  }

  return ((plansRes.data ?? []) as PlanRow[]).map((row) => ({
    id: row.id,
    planKey: row.plan_key,
    priceAmount: parseAmount(row.price_amount),
    priceAmountAnnual: parseAmount(row.price_amount_annual),
    sortOrder: row.sort_order,
    isActive: row.is_active,
    names: namesByPlan.get(row.id) ?? {},
    moduleKeys: modulesByPlan.get(row.id) ?? [],
  }));
}

export async function saveSubscriptionPlan(input: {
  id?: string;
  planKey: string;
  priceAmount: number;
  priceAmountAnnual: number;
  isActive: boolean;
  names: Record<string, string>;
  moduleKeys: string[];
}) {
  const supabase = createClient();
  const planKey = input.planKey.trim().toLowerCase();
  if (!planKey) throw new Error("Plāna atslēga ir obligāta.");
  if (!Number.isFinite(input.priceAmount) || input.priceAmount < 0) {
    throw new Error("Cena jābūt nenegatīvam skaitlim.");
  }
  if (!Number.isFinite(input.priceAmountAnnual) || input.priceAmountAnnual < 0) {
    throw new Error("Gada cena jābūt nenegatīvam skaitlim.");
  }

  let planId = input.id;

  if (planId) {
    const { error } = await supabase
      .from("subscription_plans")
      .update({
        plan_key: planKey,
        price_amount: input.priceAmount,
        price_amount_annual: input.priceAmountAnnual,
        is_active: input.isActive,
      })
      .eq("id", planId);
    if (error) throw error;
  } else {
    const { data: last } = await supabase
      .from("subscription_plans")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = ((last?.sort_order as number | undefined) ?? 0) + 10;
    const { data, error } = await supabase
      .from("subscription_plans")
      .insert({
        plan_key: planKey,
        price_amount: input.priceAmount,
        price_amount_annual: input.priceAmountAnnual,
        is_active: input.isActive,
        sort_order: sortOrder,
      })
      .select("id")
      .single();
    if (error) throw error;
    planId = data.id as string;
  }

  await supabase.from("subscription_plan_i18n").delete().eq("plan_id", planId);
  const i18nRows = Object.entries(input.names)
    .map(([language_code, name]) => ({
      plan_id: planId,
      language_code,
      name: name.trim(),
    }))
    .filter((row) => row.name.length > 0);
  if (i18nRows.length > 0) {
    const { error } = await supabase.from("subscription_plan_i18n").insert(i18nRows);
    if (error) throw error;
  }

  await supabase.from("subscription_plan_modules").delete().eq("plan_id", planId);
  const moduleRows = [...new Set(input.moduleKeys.map((key) => key.trim().toLowerCase()).filter(Boolean))].map(
    (module_key) => ({ plan_id: planId, module_key }),
  );
  if (moduleRows.length > 0) {
    const { error } = await supabase.from("subscription_plan_modules").insert(moduleRows);
    if (error) throw error;
  }

  const plans = await listSubscriptionPlans();
  const saved = plans.find((plan) => plan.id === planId);
  if (!saved) throw new Error("Plāns nav atrasts pēc saglabāšanas.");
  return saved;
}

export async function deleteSubscriptionPlan(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function setSubscriptionPlanActive(id: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("subscription_plans").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}
