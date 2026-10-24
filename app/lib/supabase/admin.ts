import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

/** Service-role client — server only. Never import from client components. */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must not run in the browser");
  }
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin env is missing. Set SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, ""), process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
