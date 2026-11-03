import type { SupabaseClient } from "@supabase/supabase-js";

/** Removes auth user (public.users + pages cascade via FK). */
export async function purgeUserAccount(
  admin: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const removed = await admin.auth.admin.deleteUser(userId);
  if (removed.error) {
    return { ok: false, message: removed.error.message };
  }
  return { ok: true };
}
