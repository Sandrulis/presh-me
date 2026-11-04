import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getUmamiPublicConfig } from "@/app/lib/integrations/umami/config";
import { getServerMaintenanceMode, getServerSiteBranding } from "@/app/lib/site-admin/settings-server";

/**
 * Branding (name, logo, favicon) must be fresh after admin save.
 * Cross-request unstable_cache + revalidateTag("max") left public Header
 * on stale defaults while /studio showed the client-store logo.
 */
export const getCachedSiteBranding = cache(async () => getServerSiteBranding());

export const getCachedMaintenanceMode = unstable_cache(
  async () => getServerMaintenanceMode(),
  ["maintenance-mode"],
  { revalidate: 15, tags: ["maintenance-mode"] },
);

export const getCachedUmamiPublicConfig = unstable_cache(
  async () => getUmamiPublicConfig(),
  ["umami-public"],
  { revalidate: 60 },
);
