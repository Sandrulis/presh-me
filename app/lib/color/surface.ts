export const TRANSPARENT_COLOR = "transparent";

export function isTransparentColor(value?: string | null): boolean {
  return value?.trim().toLowerCase() === TRANSPARENT_COLOR;
}

export function hasSolidColor(value?: string | null): boolean {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 && !isTransparentColor(trimmed);
}

export function contrastInk(hex: string): string {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return "#111111";
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

/** Bloka fons: tukšs = tēmas poga, caurspīdīgs = lapas fons, citādi izvēlētā krāsa. */
export function surfacePaint(
  color: string | undefined,
  fallbackFill: string,
  fallbackInk: string,
  pageText: string,
): { background: string; color: string; solid: boolean } {
  if (isTransparentColor(color)) {
    return { background: TRANSPARENT_COLOR, color: pageText, solid: false };
  }
  const trimmed = color?.trim();
  if (trimmed) {
    return { background: trimmed, color: contrastInk(trimmed), solid: true };
  }
  return { background: fallbackFill, color: fallbackInk, solid: false };
}
