import type { SupabaseClient } from "@supabase/supabase-js";

export async function readMaintenanceModeWithAdmin(admin: SupabaseClient): Promise<boolean> {
  const { data } = await admin
    .from("site_settings")
    .select("maintenance_mode")
    .eq("id", 1)
    .maybeSingle();
  return data?.maintenance_mode === true;
}
