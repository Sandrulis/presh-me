export type BillingActionPath = "/api/billing/cancel" | "/api/billing/resume";

export type BillingActionErrorCode =
  | "no_subscription"
  | "stripe_unavailable"
  | "cancel_failed"
  | "resume_failed"
  | "failed";

export async function runBillingAction(
  path: BillingActionPath,
): Promise<{ ok: true } | { ok: false; code: BillingActionErrorCode }> {
  try {
    const res = await fetch(path, { method: "POST", credentials: "same-origin" });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    const fallback = path === "/api/billing/cancel" ? "cancel_failed" : "resume_failed";
    const code = (body?.error ?? fallback) as BillingActionErrorCode;
    return { ok: false, code };
  } catch {
    return { ok: false, code: "failed" };
  }
}

export function billingActionErrorMessageKey(code: BillingActionErrorCode): string {
  if (code === "no_subscription") return "studio.subscription.error_no_subscription";
  if (code === "stripe_unavailable") return "studio.subscription.error_stripe_unavailable";
  return "studio.subscription.action_failed";
}
