import { NextResponse } from "next/server";
import { requestAccountDeletion } from "@/app/lib/account/deletion-server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const result = await requestAccountDeletion(user.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
