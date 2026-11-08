import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const USER_VIP_TIERS = ["off", "semi_vip", "vip"] as const;
export type UserVipTier = (typeof USER_VIP_TIERS)[number];

export function parseUserVipTier(value: unknown): UserVipTier {
  if (value === "semi_vip" || value === "vip") return value;
  return "off";
}

export function vipTierGrantsPaidModule(tier: UserVipTier, moduleKey: string): boolean {
  if (tier === "off") return false;
  if (tier === "vip") return true;
  return tier === "semi_vip" && moduleKey !== "module_multisites";
}

export async function loadUserVipTier(userId: string): Promise<UserVipTier> {
  if (!isSupabaseAdminConfigured()) return "off";
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("vip_tier").eq("id", userId).maybeSingle();
  return parseUserVipTier(data?.vip_tier);
}
