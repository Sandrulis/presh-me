import { NextResponse } from "next/server";
import { cancelScheduledAccountDeletion } from "@/app/lib/account/deletion-server";
import { createClient } from "@/app/lib/supabase/server";

/** Called after sign-in to cancel scheduled deletion and send the cancellation email. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const result = await cancelScheduledAccountDeletion(user.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, cancelled: result.cancelled });
}
