import type { CSSProperties } from "react";
import { fontFamilyOf } from "@/app/lib/font-catalog";
import type { FontId } from "@/app/lib/types";

/** Profila teksts (vārds, tagline u.c.) — krāsa, fonts un opcionāla burtu apmale. */
export function textLookStyle(options: {
  color?: string;
  fallbackColor: string;
  fontId?: FontId;
  fontSize?: number;
  strokeWidth?: number;
  strokeColor?: string;
}): CSSProperties {
  const style: CSSProperties = {
    color: options.color || options.fallbackColor,
    fontFamily: fontFamilyOf(options.fontId),
    fontSize: options.fontSize,
  };
  const width = Math.max(0, options.strokeWidth ?? 0);
  if (width > 0) {
    style.WebkitTextStrokeWidth = width;
    style.WebkitTextStrokeColor = options.strokeColor || "#111111";
    style.paintOrder = "stroke fill";
  }
  return style;
}
