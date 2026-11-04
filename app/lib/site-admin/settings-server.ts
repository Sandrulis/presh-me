import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { createClient } from "@/app/lib/supabase/server";
import { normalizeBrandImageUrl } from "@/app/lib/site-admin/branding";

export type ServerSiteBranding = {
  systemName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  notificationFaviconUrl: string | null;
  updatedAt: string;
};

const EMPTY_BRANDING: ServerSiteBranding = {
  systemName: "Presh",
  logoUrl: null,
  faviconUrl: null,
  notificationFaviconUrl: null,
  updatedAt: new Date(0).toISOString(),
};

export async function getServerSiteBranding(): Promise<ServerSiteBranding> {
  try {
    // Prefer service role so layout branding does not depend on cookie/session.
    const supabase = isSupabaseAdminConfigured()
      ? createAdminClient()
      : await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("system_name, logo_url, favicon_url, notification_favicon_url, updated_at")
      .eq("id", 1)
      .maybeSingle();
    return {
      systemName: (data?.system_name as string | undefined)?.trim() || "Presh",
      logoUrl: normalizeBrandImageUrl(data?.logo_url),
      faviconUrl: normalizeBrandImageUrl(data?.favicon_url),
      notificationFaviconUrl: normalizeBrandImageUrl(data?.notification_favicon_url),
      updatedAt:
        (typeof data?.updated_at === "string" && data.updated_at) || new Date(0).toISOString(),
    };
  } catch {
    return { ...EMPTY_BRANDING };
  }
}

export async function getServerMaintenanceMode(): Promise<boolean> {
  try {
    const supabase = await createClient();
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
