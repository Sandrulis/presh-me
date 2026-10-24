import { redirect } from "next/navigation";
import { getMfaGate, type MfaGate } from "@/app/lib/auth/mfa";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export async function requireAdminPage(): Promise<{
  userId: string;
  mfaGate: MfaGate;
}> {
  if (!isSupabaseConfigured()) redirect("/login?next=/admin");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data } = await supabase.from("users").select("is_admin, is_blocked").eq("id", user.id).maybeSingle();
  if (!data || data.is_blocked === true || data.is_admin !== true) {
    redirect("/");
  }

  const mfaGate = await getMfaGate(supabase);
  if (mfaGate === "enroll") {
    redirect("/settings?mfa=required");
  }

  return { userId: user.id, mfaGate };
}
