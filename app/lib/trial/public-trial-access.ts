import { cache } from "react";
import { isModulePaidPlansEnabledServer, userHasActivePaidSubscription } from "@/app/lib/billing/subscription-repository";
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

type PublicTrialGate = Pick<Portfolio, "published" | "accountId" | "trialStartedAt">;

async function shouldRedirectPublicTrialExpiredFor(
  page: PublicTrialGate,
): Promise<boolean> {
  if (!page.published) return false;
  const trailOn = await isModuleTrailEnabledServer();
  if (!trailOn) return false;
  const paidPlansOn = await isModulePaidPlansEnabledServer();
  if (paidPlansOn && page.accountId) {
    const paid = await userHasActivePaidSubscription(page.accountId);
    if (paid) return false;
  }
  const trialDays = await getServerTrialPeriodDays();
  return isTrialPeriodExpired(page as Portfolio, trialDays);
}

/** Public profile URL: expired trial → marketing home unless paid subscription is active. */
export async function shouldRedirectPublicTrialExpired(page: Portfolio): Promise<boolean> {
  return shouldRedirectPublicTrialExpiredFor(page);
}

/** Publiskais /handle: melnraksts vai beidzies trial → sākumlapa. */
export async function shouldRedirectPublicProfileAway(page: Portfolio): Promise<boolean> {
  if (!page.published) return true;
  return shouldRedirectPublicTrialExpiredFor(page);
}

/** Same gate as `shouldRedirectPublicProfileAway` without loading full page `content`. */
export async function shouldRedirectPublicProfileAwayLite(input: {
  published: boolean;
  accountId: string;
  trialStartedAt: string | null;
}): Promise<boolean> {
  if (!input.published) return true;
  return shouldRedirectPublicTrialExpiredFor({
    published: input.published,
    accountId: input.accountId,
    trialStartedAt: input.trialStartedAt,
  });
}
