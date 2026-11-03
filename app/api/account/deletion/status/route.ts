import { NextResponse } from "next/server";
import { cancelScheduledAccountDeletion, loadUserDeletionRow, mapDeletionStatus } from "@/app/lib/account/deletion-server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await loadUserDeletionRow(user.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(mapDeletionStatus(row));
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await cancelScheduledAccountDeletion(user.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, cancelled: result.cancelled });
}
