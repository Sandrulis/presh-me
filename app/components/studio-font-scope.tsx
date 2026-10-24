import type { ReactNode } from "react";
import { studioFontVariables } from "@/app/lib/font-faces-studio";

/** Wraps studio / public pages that need theme font CSS variables. */
export function StudioFontScope({ children }: { children: ReactNode }) {
  return <div className={studioFontVariables}>{children}</div>;
}
