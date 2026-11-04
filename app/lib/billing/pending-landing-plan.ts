const STORAGE_KEY = "presh_landing_checkout_plan";

export function stashLandingCheckoutPlan(planKey: string) {
  if (typeof window === "undefined") return;
  const key = planKey.trim().toLowerCase();
  if (!key) return;
  sessionStorage.setItem(STORAGE_KEY, key);
}

export function takeLandingCheckoutPlan(): string | null {
  if (typeof window === "undefined") return null;
  const key = sessionStorage.getItem(STORAGE_KEY)?.trim().toLowerCase() ?? "";
  if (!key) return null;
  sessionStorage.removeItem(STORAGE_KEY);
  return key;
}
