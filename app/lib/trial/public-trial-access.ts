import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";
import { isTrialPeriodExpired } from "@/app/lib/trial/is-trial-expired";
import type { Portfolio } from "@/app/lib/types";

export const isModuleTrailEnabledServer = cache(async function isModuleTrailEnabledServer(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_frontend_modules")
      .select("is_enabled")
      .eq("module_key", "module_trail")
      .maybeSingle();
    return data?.is_enabled === true;
  } catch {
    return false;
  }
});

export const getServerTrialPeriodDays = cache(async function getServerTrialPeriodDays(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("trial_period_days")
      .eq("id", 1)
      .maybeSingle();
    return Math.max(1, Math.min(365, Number(data?.trial_period_days ?? 14)));
  } catch {
    return 14;
  }
});

export function isPublicTrialExpired(
  page: Portfolio,
  trialPeriodDays: number,
  nowMs: number = Date.now(),
): boolean {
  return isTrialPeriodExpired(page, trialPeriodDays, nowMs);
}

/** Public profile URL: expired trial → marketing home (visi apmeklētāji, arī īpašnieks). */
export async function shouldRedirectPublicTrialExpired(page: Portfolio): Promise<boolean> {
  if (!page.published) return false;
  const trailOn = await isModuleTrailEnabledServer();
  if (!trailOn) return false;
  const trialDays = await getServerTrialPeriodDays();
  return isTrialPeriodExpired(page, trialDays);
}

/** Publiskais /handle: melnraksts vai beidzies trial → sākumlapa. */
export async function shouldRedirectPublicProfileAway(page: Portfolio): Promise<boolean> {
  if (!page.published) return true;
  return shouldRedirectPublicTrialExpired(page);
}
