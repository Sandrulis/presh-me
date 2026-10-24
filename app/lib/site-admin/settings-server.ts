import { createClient } from "@/app/lib/supabase/server";
import { normalizeBrandImageUrl } from "@/app/lib/site-admin/branding";

export type ServerSiteBranding = {
  systemName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  notificationFaviconUrl: string | null;
};

export async function getServerSiteBranding(): Promise<ServerSiteBranding> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("system_name, logo_url, favicon_url, notification_favicon_url")
      .eq("id", 1)
      .maybeSingle();
    return {
      systemName: (data?.system_name as string | undefined)?.trim() || "Presh",
      logoUrl: normalizeBrandImageUrl(data?.logo_url),
      faviconUrl: normalizeBrandImageUrl(data?.favicon_url),
      notificationFaviconUrl: normalizeBrandImageUrl(data?.notification_favicon_url),
    };
  } catch {
    return {
      systemName: "Presh",
      logoUrl: null,
      faviconUrl: null,
      notificationFaviconUrl: null,
    };
  }
}
