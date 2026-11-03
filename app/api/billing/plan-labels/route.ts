import { NextResponse } from "next/server";
import { listActiveSubscriptionPlanLabels } from "@/app/lib/billing/subscription-repository";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const langParam = url.searchParams.get("lang")?.trim();
  let languageCode = langParam || "lv";
  if (!langParam) {
    const { data: profile } = await supabase
      .from("users")
      .select("language_code")
      .eq("id", user.id)
      .maybeSingle();
    languageCode = (profile?.language_code as string | undefined)?.trim() || "lv";
  }

  try {
    const plans = await listActiveSubscriptionPlanLabels(languageCode);
    return NextResponse.json({ plans });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load plan labels";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
