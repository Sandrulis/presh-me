import { createAdminClient } from "@/app/lib/supabase/admin";

export async function writeAdminAudit(input: {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_events").insert({
      actor_id: input.actorId,
      action: input.action,
      target_type: input.targetType ?? "",
      target_id: input.targetId ?? "",
      meta: input.meta ?? {},
    });
  } catch {
    /* never block primary action on audit failure */
  }
}
