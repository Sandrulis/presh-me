import { NextResponse } from "next/server";
import { parseUserVipTier, USER_VIP_TIERS, type UserVipTier } from "@/app/lib/billing/user-vip-tier";
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
    blocked?: boolean;
    vipTier?: string;
  } | null;
  const id = body?.id?.trim() ?? "";
  if (!id) return NextResponse.json({ ok: false, message: "Trūkst id." }, { status: 400 });

  const patchBlocked = typeof body?.blocked === "boolean";
  const patchVipTier = body?.vipTier !== undefined;
  if (!patchBlocked && !patchVipTier) {
    return NextResponse.json({ ok: false, message: "Nav ko mainīt." }, { status: 400 });
  }

  let blocked: boolean | undefined;
  let vipTier: UserVipTier | undefined;

  if (patchBlocked) {
    blocked = body!.blocked === true;
    if (blocked && id === auth.user!.id) {
      return NextResponse.json({ ok: false, message: "Nevar bloķēt savu kontu." }, { status: 400 });
    }

    const { error: profileError } = await auth.admin!.from("users").update({ is_blocked: blocked }).eq("id", id);
    if (profileError) {
      return NextResponse.json({ ok: false, message: profileError.message }, { status: 500 });
    }

    const ban = await auth.admin!.auth.admin.updateUserById(id, {
      ban_duration: blocked ? "876000h" : "none",
    });
    if (ban.error) {
      return NextResponse.json({ ok: false, message: ban.error.message }, { status: 500 });
    }

    await writeAdminAudit({
      actorId: auth.user!.id,
      action: blocked ? "users.block" : "users.unblock",
      targetType: "users",
      targetId: id,
    });
  }

  if (patchVipTier) {
    const raw = String(body!.vipTier ?? "").trim();
    if (!USER_VIP_TIERS.includes(raw as UserVipTier)) {
      return NextResponse.json({ ok: false, message: "Nederīgs VIP līmenis." }, { status: 400 });
    }
    vipTier = parseUserVipTier(raw);
    const { error: tierError } = await auth.admin!.from("users").update({ vip_tier: vipTier }).eq("id", id);
    if (tierError) {
      return NextResponse.json({ ok: false, message: tierError.message }, { status: 500 });
    }
    await writeAdminAudit({
      actorId: auth.user!.id,
      action: "users.vip_tier",
      targetType: "users",
      targetId: id,
      meta: { vip_tier: vipTier },
    });
  }

  return NextResponse.json({ ok: true, id, blocked, vipTier });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim() ?? "";
  if (!id) return NextResponse.json({ ok: false, message: "Trūkst id." }, { status: 400 });
  if (id === auth.user!.id) {
    return NextResponse.json({ ok: false, message: "Nevar dzēst savu kontu." }, { status: 400 });
  }

  const removed = await auth.admin!.auth.admin.deleteUser(id);
  if (removed.error) {
    return NextResponse.json({ ok: false, message: removed.error.message }, { status: 500 });
  }

  await writeAdminAudit({
    actorId: auth.user!.id,
    action: "users.delete",
    targetType: "users",
    targetId: id,
  });

  return NextResponse.json({ ok: true, id });
}
