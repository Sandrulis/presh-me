import { computeTrialProgress } from "@/app/lib/trial/compute-trial-progress";
import type { Portfolio } from "@/app/lib/types";

export function isTrialPeriodExpired(
  page: Portfolio,
  trialPeriodDays: number,
  nowMs: number = Date.now(),
): boolean {
  if (!page.published || !page.trialStartedAt) return false;
  const progress = computeTrialProgress(page.trialStartedAt, trialPeriodDays, nowMs);
  return progress?.expired === true;
}
