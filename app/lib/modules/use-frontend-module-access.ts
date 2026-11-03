"use client";

import { useEffect, useState } from "react";
import type { FrontendModuleAccess } from "@/app/lib/modules/user-module-access";

const EMPTY: FrontendModuleAccess = {
  moduleEnabled: false,
  isPaid: false,
  canUse: false,
  paidPlansEnabled: false,
};

export function useFrontendModuleAccess(moduleKey: string) {
  const [access, setAccess] = useState<FrontendModuleAccess>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/modules/access?key=${encodeURIComponent(moduleKey)}`, { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) return EMPTY;
        return (await res.json()) as FrontendModuleAccess;
      })
      .then((data) => {
        if (!cancelled) setAccess(data);
      })
      .catch(() => {
        if (!cancelled) setAccess(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleKey]);

  return { access, loading };
}
