import type { ReactNode } from "react";
import { StudioFontScope } from "@/app/components/studio-font-scope";

export default function HandleLayout({ children }: { children: ReactNode }) {
  return <StudioFontScope>{children}</StudioFontScope>;
}
