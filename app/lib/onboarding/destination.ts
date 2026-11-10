import type { Onboarding, StepId } from "@/app/lib/types";

const STEP_ORDER: StepId[] = ["start", "profile", "sections", "look", "link"];

const STEP_NUMBER: Record<StepId, number> = {
  start: 1,
  profile: 2,
  sections: 3,
  look: 4,
  link: 5,
};

export function readOnboarding(content: unknown): Onboarding | null {
  if (!content || typeof content !== "object") return null;
  const onboarding = (content as { onboarding?: Onboarding }).onboarding;
  return onboarding ?? null;
}

/** First wizard step that is still open; summary (6) when all marks are done but onboarding not finished. */
export function onboardingResumeStep(onboarding: Onboarding): number {
  if (onboarding.finished) return 6;
  for (const id of STEP_ORDER) {
    const mark = onboarding.marks?.[id] ?? "open";
    if (mark === "open") return STEP_NUMBER[id];
  }
  return onboarding.step >= 6 ? 6 : Math.max(1, Math.min(5, onboarding.step));
}

/** Wizard was left after the first step and has not been finished. */
export function pageDesignInProgress(onboarding: Onboarding | null | undefined): boolean {
  if (!onboarding || onboarding.finished) return false;
  return onboarding.step > 1;
}

export function onboardingNeedsWizard(content: unknown, hasPage: boolean): boolean {
  if (!hasPage) return true;
  const onboarding = readOnboarding(content);
  return !onboarding || onboarding.finished === false;
}

export function resolveAppEntryPath(content: unknown, hasPage: boolean): "/studio" | "/start" {
  return onboardingNeedsWizard(content, hasPage) ? "/start" : "/studio";
}

export function normalizeOnboardingStep(onboarding: Onboarding): Onboarding {
  if (onboarding.finished) return onboarding;
  const step = onboardingResumeStep(onboarding);
  if (step === onboarding.step) return onboarding;
  return { ...onboarding, step };
}
