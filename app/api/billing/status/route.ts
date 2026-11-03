import { NextResponse } from "next/server";
import {
  isSubscriptionAccessActive,
  mapSubscriptionView,
  subscriptionUiPhase,
} from "@/app/lib/billing/subscription-access";
import {
  isModulePaidPlansEnabledServer,
  loadUserSubscriptionDetails,
} from "@/app/lib/billing/subscription-repository";
import { createClient } from "@/app/lib/supabase/server";

async function sessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("users")
    .select("language_code, is_blocked")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_blocked) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    languageCode: (profile?.language_code as string | undefined)?.trim() || "lv",
  };
}

export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paidPlansEnabled = await isModulePaidPlansEnabledServer();
  if (!paidPlansEnabled) {
    return NextResponse.json({
      paidPlansEnabled: false,
      subscription: null,
      phase: "none" as const,
      hasActiveAccess: false,
    });
  }

  const { row, planKey, planName, pendingPlanKey, pendingPlanName } = await loadUserSubscriptionDetails(
    user.id,
    user.languageCode,
  );
  const view = mapSubscriptionView(row, planKey, planName, pendingPlanKey, pendingPlanName);
  const phase = subscriptionUiPhase(view);
  const hasActiveAccess = isSubscriptionAccessActive(row);

  return NextResponse.json({
    paidPlansEnabled: true,
    subscription: view,
    phase,
    hasActiveAccess,
  });
}
