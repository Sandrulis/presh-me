import { getMfaGate } from "@/app/lib/auth/mfa";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

/** For authenticated app shells: challenge TOTP when the user already enrolled. */
export async function resolveLoginMfaVerify(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const gate = await getMfaGate(supabase);
    return gate === "verify";
  } catch {
    return false;
  }
}
