import { NextResponse } from "next/server";
import { isSubscriptionAccessActive } from "@/app/lib/billing/subscription-access";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ ok: false, message: "Nav sesijas." }, { status: 401 }) };
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (profile?.is_admin !== true) {
    return { error: NextResponse.json({ ok: false, message: "Nav pieejas." }, { status: 403 }) };
  }
  return { admin: createAdminClient(), actorId: user.id };
}

export type AdminSubscriptionSummary = {
  planKey: string | null;
  planName: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
};

type SubRow = {
  user_id: string;
  plan_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
};

async function loadPlanMeta(admin: ReturnType<typeof createAdminClient>, lang: string) {
  const planKeyById = new Map<string, string>();
  const planNameById = new Map<string, string>();
  const { data: plans } = await admin.from("subscription_plans").select("id, plan_key");
  for (const plan of plans ?? []) {
    planKeyById.set(plan.id as string, plan.plan_key as string);
  }
  const planIds = [...planKeyById.keys()];
  if (planIds.length === 0) return { planKeyById, planNameById };

  const { data: i18nRows } = await admin
    .from("subscription_plan_i18n")
    .select("plan_id, language_code, name")
    .in("plan_id", planIds);
  const namesByPlan = new Map<string, Record<string, string>>();
  for (const row of i18nRows ?? []) {
    const planId = row.plan_id as string;
    const bucket = namesByPlan.get(planId) ?? {};
    bucket[row.language_code as string] = row.name as string;
    namesByPlan.set(planId, bucket);
  }
  for (const planId of planIds) {
    const names = namesByPlan.get(planId) ?? {};
    const name =
      names[lang]?.trim() ||
      names.lv?.trim() ||
      names.en?.trim() ||
      planKeyById.get(planId) ||
      null;
    if (name) planNameById.set(planId, name);
  }
  return { planKeyById, planNameById };
}

function rowToSummary(
  row: SubRow,
  planKeyById: Map<string, string>,
  planNameById: Map<string, string>,
  nowMs: number,
): AdminSubscriptionSummary | null {
  const status = row.status ?? "none";
  const currentPeriodEnd = row.current_period_end ?? null;
  const cancelAtPeriodEnd = row.cancel_at_period_end === true;
  const stripeSubscriptionId = row.stripe_subscription_id ?? null;
  const planId = row.plan_id ?? null;

  if (status === "none" && !stripeSubscriptionId && !planId) return null;

  const planKey = planId ? planKeyById.get(planId) ?? null : null;
  const planName = planId ? planNameById.get(planId) ?? planKey : null;
  const isActive = isSubscriptionAccessActive({ status, current_period_end: currentPeriodEnd }, nowMs);

  return {
    planKey,
    planName,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    isActive,
  };
}

async function buildByUserId(admin: ReturnType<typeof createAdminClient>, lang: string) {
  const { data: subs, error: subsError } = await admin
    .from("user_subscriptions")
    .select("user_id, plan_id, status, current_period_end, cancel_at_period_end, stripe_subscription_id");
  if (subsError) throw new Error(subsError.message);

  const { planKeyById, planNameById } = await loadPlanMeta(admin, lang);
  const byUserId: Record<string, AdminSubscriptionSummary> = {};
  const nowMs = Date.now();

  for (const row of (subs ?? []) as SubRow[]) {
    const summary = rowToSummary(row, planKeyById, planNameById, nowMs);
    if (summary) byUserId[row.user_id] = summary;
  }
  return byUserId;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const lang = new URL(request.url).searchParams.get("lang")?.trim().toLowerCase() || "lv";

  try {
    const byUserId = await buildByUserId(auth.admin!, lang);
    return NextResponse.json({ ok: true, byUserId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
