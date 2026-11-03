import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/app/lib/billing/subscription-repository";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { planKey?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const planKey = body.planKey?.trim().toLowerCase();
  if (!planKey) return NextResponse.json({ error: "Missing planKey" }, { status: 400 });

  const { data: profile } = await supabase
    .from("users")
    .select("language_code, is_blocked")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_blocked) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const languageCode = (profile?.language_code as string | undefined)?.trim() || "lv";

  try {
    const url = await createCheckoutSession({
      userId: user.id,
      email: user.email ?? "",
      planKey,
      languageCode,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "checkout_failed";
    if (code === "stripe_unavailable") {
      return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });
    }
    if (code === "plan_not_found" || code === "plan_price_invalid") {
      return NextResponse.json({ error: code }, { status: 400 });
    }
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
