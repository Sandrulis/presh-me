"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { bindAuthListener, hydrateSession, reportPresence } from "@/app/lib/store";

const PRESENCE_INTERVAL_MS = 5 * 60 * 1000;

const SessionHintContext = createContext(false);

export function useSessionHint() {
  return useContext(SessionHintContext);
}

export function AuthProvider({
  children,
  sessionHint = false,
}: {
  children: ReactNode;
  sessionHint?: boolean;
}) {
  useEffect(() => {
    void hydrateSession();
    const unbind = bindAuthListener();
    const timer = window.setInterval(() => {
      void reportPresence();
    }, PRESENCE_INTERVAL_MS);
    return () => {
      unbind();
      window.clearInterval(timer);
    };
  }, []);

  return <SessionHintContext.Provider value={sessionHint}>{children}</SessionHintContext.Provider>;
}
