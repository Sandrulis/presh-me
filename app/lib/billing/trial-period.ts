import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

const DEFAULT_TRIAL_DAYS = 14;

export function clampTrialPeriodDays(value: unknown): number {
  return Math.max(1, Math.min(365, Number(value) || DEFAULT_TRIAL_DAYS));
}

export async function loadSubscriptionTrialPeriodDaysAdmin(): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return DEFAULT_TRIAL_DAYS;
  }
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_settings")
      .select("trial_period_days")
      .eq("id", 1)
      .maybeSingle();
    return clampTrialPeriodDays(data?.trial_period_days);
  } catch {
    return DEFAULT_TRIAL_DAYS;
  }
}
