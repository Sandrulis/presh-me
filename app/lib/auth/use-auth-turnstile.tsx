"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/app/components/turnstile-widget";
import { getPublicTurnstileConfig } from "@/app/lib/integrations/public-turnstile";

export function useAuthTurnstile() {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  useEffect(() => {
    let cancelled = false;
    void getPublicTurnstileConfig().then((config) => {
      if (cancelled) return;
      setSiteKey(config.enabled ? config.siteKey : null);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enabled = Boolean(siteKey);

  const ensureVerified = useCallback(async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!siteKey) return { ok: true };
    const token = turnstileRef.current?.getToken()?.trim() ?? "";
    if (!token) {
      return { ok: false, message: "Apstiprini, ka neesi robots." };
    }
    const response = await fetch("/api/auth/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; message?: string }
      | null;
    if (!response.ok || !payload?.ok) {
      turnstileRef.current?.reset();
      return {
        ok: false,
        message: payload?.message ?? "Botu pārbaude neizdevās. Mēģini vēlreiz.",
      };
    }
    // Token is single-use; refresh for a possible auth retry.
    turnstileRef.current?.reset();
    return { ok: true };
  }, [siteKey]);

  const field =
    ready && siteKey ? (
      <div className="py-1">
        <TurnstileWidget ref={turnstileRef} siteKey={siteKey} />
      </div>
    ) : null;

  return { enabled, ready, field, ensureVerified, turnstileRef };
}
