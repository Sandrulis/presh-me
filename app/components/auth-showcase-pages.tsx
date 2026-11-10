"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Portfolio } from "@/app/lib/types";

const AuthShowcasePagesContext = createContext<Portfolio[] | undefined>(undefined);

export function AuthShowcaseProvider({
  pages,
  children,
}: {
  pages: Portfolio[];
  children: ReactNode;
}) {
  return <AuthShowcasePagesContext.Provider value={pages}>{children}</AuthShowcasePagesContext.Provider>;
}

/** `undefined` = caller did not opt in (demo collage). An array is published pages only. */
export function useAuthShowcasePages(): Portfolio[] | undefined {
  return useContext(AuthShowcasePagesContext);
}
