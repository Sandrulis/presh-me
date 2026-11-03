"use client";

import { useEffect, useState } from "react";
import type { ActivePlanLabel } from "@/app/lib/billing/plan-label-types";
import { resolvePlanBadgeLabelForModule } from "@/app/lib/billing/plan-label-types";

export function useSubscriptionPlanLabels(languageCode: string) {
  const [plans, setPlans] = useState<ActivePlanLabel[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/billing/plan-labels?lang=${encodeURIComponent(languageCode)}`, {
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as { plans?: ActivePlanLabel[] };
        return data.plans ?? [];
      })
      .then((rows) => {
        if (!cancelled) setPlans(rows);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      });
    return () => {
      cancelled = true;
    };
  }, [languageCode]);

  function badgeLabelForModule(moduleKey: string, fallbackName: string) {
    return resolvePlanBadgeLabelForModule(moduleKey, plans, fallbackName);
  }

  return { plans, badgeLabelForModule };
}
