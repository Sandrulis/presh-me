import { NextResponse } from "next/server";
import { resumeSubscription } from "@/app/lib/billing/subscription-repository";
import { createClient } from "@/app/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await resumeSubscription(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "resume_failed";
    if (code === "no_subscription") return NextResponse.json({ error: code }, { status: 400 });
    if (code === "stripe_unavailable") return NextResponse.json({ error: code }, { status: 503 });
    return NextResponse.json({ error: "resume_failed" }, { status: 500 });
  }
}
