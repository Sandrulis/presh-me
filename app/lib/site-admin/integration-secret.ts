import { createAdminClient } from "@/app/lib/supabase/admin";
import { decryptSecret } from "@/app/lib/security/secrets";

export async function readIntegrationSecret(key: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_integrations")
    .select("client_secret")
    .eq("integration_key", key)
    .maybeSingle();
  const stored = (data as { client_secret?: string } | null)?.client_secret ?? "";
  try {
    return decryptSecret(stored);
  } catch {
    return stored;
  }
}
