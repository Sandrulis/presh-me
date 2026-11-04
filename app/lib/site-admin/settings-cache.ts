import { unstable_cache } from "next/cache";
import { getUmamiPublicConfig } from "@/app/lib/integrations/umami/config";
import { getServerMaintenanceMode, getServerSiteBranding } from "@/app/lib/site-admin/settings-server";

export const getCachedSiteBranding = unstable_cache(
  async () => getServerSiteBranding(),
  ["site-branding"],
  { revalidate: 60, tags: ["site-branding"] },
);

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
