import { unstable_cache } from "next/cache";
import { getUmamiPublicConfig } from "@/app/lib/integrations/umami/config";
import { getServerSiteBranding } from "@/app/lib/site-admin/settings-server";

export const getCachedSiteBranding = unstable_cache(
  async () => getServerSiteBranding(),
  ["site-branding"],
  { revalidate: 60 },
);

export const getCachedUmamiPublicConfig = unstable_cache(
  async () => getUmamiPublicConfig(),
  ["umami-public"],
  { revalidate: 60 },
);
