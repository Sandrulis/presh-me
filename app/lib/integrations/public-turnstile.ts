import { createClient } from "@/app/lib/supabase/client";

export type PublicTurnstileConfig = {
  enabled: boolean;
  siteKey: string;
};

export async function getPublicTurnstileConfig(): Promise<PublicTurnstileConfig> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("public_turnstile_config");
    if (error) return { enabled: false, siteKey: "" };

    let row: Record<string, unknown> | null = null;
    if (typeof data === "string") {
      try {
        const parsed: unknown = JSON.parse(data);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          row = parsed as Record<string, unknown>;
        }
      } catch {
        return { enabled: false, siteKey: "" };
      }
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      row = data as Record<string, unknown>;
    }
    if (!row) return { enabled: false, siteKey: "" };

    const siteKey = String(row.siteKey ?? "").trim();
    return {
      enabled: row.enabled === true && siteKey.length > 0,
      siteKey,
    };
  } catch {
    return { enabled: false, siteKey: "" };
  }
}
