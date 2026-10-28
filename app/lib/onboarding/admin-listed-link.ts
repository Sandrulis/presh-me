import type { Onboarding, Portfolio, StepId } from "@/app/lib/types";

const STEP_ORDER: StepId[] = ["start", "profile", "sections", "look", "link"];

/** Vai lietotājs vismaz ir sācis onboarding (ne tikai tukšs konta ieraksts). */
export function onboardingHasStarted(onboarding: Onboarding): boolean {
  if (onboarding.finished) return true;
  if (onboarding.step > 1) return true;
  if (onboarding.source != null) return true;
  if (onboarding.instagram.trim() || onboarding.website.trim() || onboarding.sourceNote.trim()) {
    return true;
  }
  if (onboarding.sections.length > 0) return true;
  for (const id of STEP_ORDER) {
    const mark = onboarding.marks?.[id];
    if (mark && mark !== "open") return true;
  }
  return false;
}

/**
 * Admin „Linki”: rāda tikai reāli āktos / pabeigtos linkus.
 * Reģistrācijas placeholders bez onboarding un bez publicēšanas nerāda.
 */
export function isAdminListedLink(page: Portfolio): boolean {
  if (page.published) return true;
  const onboarding = page.onboarding;
  if (!onboarding) return false;
  return onboardingHasStarted(onboarding);
}
