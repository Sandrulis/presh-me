import {
  isModulePaidPlansEnabledServer,
  loadUserSubscriptionRow,
} from "@/app/lib/billing/subscription-repository";
import { isSubscriptionAccessActive } from "@/app/lib/billing/subscription-access";
import { loadUserVipTier, vipTierGrantsPaidModule } from "@/app/lib/billing/user-vip-tier";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type FrontendModuleAccess = {
  moduleEnabled: boolean;
  isPaid: boolean;
  canUse: boolean;
  paidPlansEnabled: boolean;
};

export async function loadFrontendModuleRow(moduleKey: string) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_frontend_modules")
    .select("is_enabled, is_paid")
    .eq("module_key", moduleKey)
    .maybeSingle();
  return data as { is_enabled: boolean; is_paid: boolean } | null;
}

export async function userCanUseFrontendModule(userId: string, moduleKey: string): Promise<boolean> {
  const mod = await loadFrontendModuleRow(moduleKey);
  if (!mod?.is_enabled) return false;
  if (!mod.is_paid) return true;

  const paidPlansEnabled = await isModulePaidPlansEnabledServer();
  if (!paidPlansEnabled) return true;

  const vipTier = await loadUserVipTier(userId);
  if (vipTierGrantsPaidModule(vipTier, moduleKey)) return true;

  const row = await loadUserSubscriptionRow(userId);
  if (!isSubscriptionAccessActive(row)) return false;
  if (!row?.plan_id) return false;

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("subscription_plan_modules")
    .select("module_key")
    .eq("plan_id", row.plan_id)
    .eq("module_key", moduleKey)
    .maybeSingle();
  return Boolean(link);
}

export async function resolveFrontendModuleAccess(
  userId: string,
  moduleKey: string,
): Promise<FrontendModuleAccess> {
  const mod = await loadFrontendModuleRow(moduleKey);
  const moduleEnabled = mod?.is_enabled === true;
  const isPaid = mod?.is_paid === true;
  const paidPlansEnabled = await isModulePaidPlansEnabledServer();
  if (!moduleEnabled) {
    return { moduleEnabled: false, isPaid, canUse: false, paidPlansEnabled };
  }
  if (!isPaid) {
    return { moduleEnabled: true, isPaid: false, canUse: true, paidPlansEnabled };
  }
  if (!paidPlansEnabled) {
    return { moduleEnabled: true, isPaid: true, canUse: true, paidPlansEnabled: false };
  }
  const canUse = await userCanUseFrontendModule(userId, moduleKey);
  return { moduleEnabled: true, isPaid: true, canUse, paidPlansEnabled: true };
}

/** Admin bypass for studio previews. */
export async function userCanUseFrontendModuleOrAdmin(
  userId: string,
  moduleKey: string,
  isAdmin: boolean,
): Promise<boolean> {
  if (isAdmin) {
    const mod = await loadFrontendModuleRow(moduleKey);
    return mod?.is_enabled === true;
  }
  return userCanUseFrontendModule(userId, moduleKey);
}
