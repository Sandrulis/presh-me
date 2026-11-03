"use client";

import { UmamiAnalytics } from "@/app/components/umami-analytics";
import type { UmamiPublicConfig } from "@/app/lib/integrations/umami/config";

export function PageUmamiTracker(config: UmamiPublicConfig) {
  return <UmamiAnalytics {...config} scriptId="umami-analytics-page" />;
}
