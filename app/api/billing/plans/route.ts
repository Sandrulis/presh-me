import { NextResponse } from "next/server";
import { listPublicBillingPlans } from "@/app/lib/billing/subscription-repository";
import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("language_code")
    .eq("id", user.id)
    .maybeSingle();
  const languageCode = (profile?.language_code as string | undefined)?.trim() || "lv";

  try {
    const plans = await listPublicBillingPlans(languageCode);
    return NextResponse.json({ plans });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load plans";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
