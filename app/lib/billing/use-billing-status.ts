"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserSubscriptionView } from "@/app/lib/billing/subscription-access";

export type BillingStatusPayload = {
  paidPlansEnabled: boolean;
  subscription: UserSubscriptionView | null;
  phase: "none" | "active" | "canceling" | "ended";
  hasActiveAccess: boolean;
};

const EMPTY: BillingStatusPayload = {
  paidPlansEnabled: false,
  subscription: null,
  phase: "none",
  hasActiveAccess: false,
};

export function useBillingStatus(options?: { refreshKey?: string | number }) {
  const [status, setStatus] = useState<BillingStatusPayload>(EMPTY);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status", { credentials: "same-origin" });
      if (!res.ok) {
        setStatus(EMPTY);
        return;
      }
      const data = (await res.json()) as BillingStatusPayload;
      setStatus(data);
    } catch {
      setStatus(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, options?.refreshKey]);

  return { status, loading, reload };
}
