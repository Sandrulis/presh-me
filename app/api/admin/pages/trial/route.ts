import { NextResponse } from "next/server";
import { writeAdminAudit } from "@/app/lib/security/admin-audit";
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
  return { user, admin: createAdminClient() };
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    trialStartedAt?: string | null;
  } | null;
  const id = body?.id?.trim() ?? "";
  if (!id) return NextResponse.json({ ok: false, message: "Trūkst id." }, { status: 400 });

  let trialStartedAt: string | null = null;
  if (body?.trialStartedAt === null) {
    trialStartedAt = null;
  } else if (typeof body?.trialStartedAt === "string") {
    const parsed = Date.parse(body.trialStartedAt.trim());
    if (!Number.isFinite(parsed)) {
      return NextResponse.json({ ok: false, message: "Nederīgs datums." }, { status: 400 });
    }
    trialStartedAt = new Date(parsed).toISOString();
  } else {
    return NextResponse.json({ ok: false, message: "Trūkst trialStartedAt." }, { status: 400 });
  }

  const { data: row, error: readError } = await auth.admin!
    .from("pages")
    .select("content")
    .eq("id", id)
    .maybeSingle();
  if (readError) return NextResponse.json({ ok: false, message: readError.message }, { status: 500 });
  if (!row) return NextResponse.json({ ok: false, message: "Lapa nav atrasta." }, { status: 404 });

  const content = { ...((row.content as Record<string, unknown> | null) ?? {}) };
  if (trialStartedAt) content.trialStartedAt = trialStartedAt;
  else delete content.trialStartedAt;

  const updatedAt = new Date().toISOString();
  const { error: writeError } = await auth.admin!
    .from("pages")
    .update({ content, updated_at: updatedAt })
    .eq("id", id);
  if (writeError) return NextResponse.json({ ok: false, message: writeError.message }, { status: 500 });

  await writeAdminAudit({
    actorId: auth.user!.id,
    action: "pages.trial_started_at",
    targetType: "pages",
    targetId: id,
    meta: { trialStartedAt },
  });

  return NextResponse.json({ ok: true, id, trialStartedAt, updatedAt });
}
