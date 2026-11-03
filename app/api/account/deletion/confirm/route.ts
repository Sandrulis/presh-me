import { NextResponse } from "next/server";
import { confirmAccountDeletionByToken } from "@/app/lib/account/deletion-server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ ok: false, message: "settings.danger.invalid_token" }, { status: 400 });
  }

  const result = await confirmAccountDeletionByToken(token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
