import { createClient } from "@/app/lib/supabase/client";

export async function fetchMaintenanceModeClient(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("maintenance_mode")
      .eq("id", 1)
      .maybeSingle();
    return data?.maintenance_mode === true;
  } catch {
    return false;
  }
}
