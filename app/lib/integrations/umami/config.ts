import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { parseUmamiShareUrl } from "@/app/lib/integrations/umami/share";

const DEFAULT_UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

export type UmamiPublicConfig = {
  websiteId: string;
  scriptSrc: string;
  integrity?: string;
};

async function loadUmamiRow() {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_integrations")
      .select("client_id, client_secret, configured_account_email, is_configured, is_enabled")
      .eq("integration_key", "umami")
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function getUmamiPublicConfig(): Promise<UmamiPublicConfig | null> {
  const data = await loadUmamiRow();
  if (!data?.is_enabled || !data.is_configured) return null;
  const websiteId = (data.client_id ?? "").trim();
  if (!websiteId) return null;
  let scriptSrc = (data.client_secret ?? "").trim() || DEFAULT_UMAMI_SCRIPT_URL;
  if (scriptSrc.startsWith("enc:v1:")) {
    try {
      const { decryptSecret } = await import("@/app/lib/security/secrets");
      scriptSrc = decryptSecret(scriptSrc) || DEFAULT_UMAMI_SCRIPT_URL;
    } catch {
      scriptSrc = DEFAULT_UMAMI_SCRIPT_URL;
    }
  }
  return { websiteId, scriptSrc };
}

export async function getUmamiShareUrl(): Promise<string | null> {
  const data = await loadUmamiRow();
  if (!data?.is_enabled) return null;
  return parseUmamiShareUrl(data.configured_account_email ?? "")?.url ?? null;
}
