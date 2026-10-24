export const FONT_OPTIONS = [
  { id: "sans", label: "Geist", family: "var(--font-geist), ui-sans-serif, system-ui, sans-serif", group: "sans" },
  { id: "inter", label: "Inter", family: "var(--font-inter), ui-sans-serif, sans-serif", group: "sans" },
  { id: "manrope", label: "Manrope", family: "var(--font-manrope), ui-sans-serif, sans-serif", group: "sans" },
  { id: "dm-sans", label: "DM Sans", family: "var(--font-dm-sans), ui-sans-serif, sans-serif", group: "sans" },
  { id: "outfit", label: "Outfit", family: "var(--font-outfit), ui-sans-serif, sans-serif", group: "sans" },
  { id: "montserrat", label: "Montserrat", family: "var(--font-montserrat), ui-sans-serif, sans-serif", group: "sans" },
  { id: "nunito", label: "Nunito", family: "var(--font-nunito), ui-sans-serif, sans-serif", group: "sans" },
  { id: "space-grotesk", label: "Space Grotesk", family: "var(--font-space-grotesk), ui-sans-serif, sans-serif", group: "sans" },
  { id: "serif", label: "Lora", family: "var(--font-lora), Georgia, serif", group: "serif" },
  { id: "playfair", label: "Playfair Display", family: "var(--font-playfair), Georgia, serif", group: "serif" },
  { id: "libre", label: "Libre Baskerville", family: "var(--font-libre), Georgia, serif", group: "serif" },
  { id: "source-serif", label: "Source Serif 4", family: "var(--font-source-serif), Georgia, serif", group: "serif" },
  { id: "caveat", label: "Caveat", family: "var(--font-caveat), cursive", group: "script" },
  { id: "comfortaa", label: "Comfortaa", family: "var(--font-comfortaa), ui-sans-serif, sans-serif", group: "script" },
  { id: "mono", label: "Geist Mono", family: "var(--font-geist-mono), ui-monospace, monospace", group: "mono" },
  { id: "jetbrains", label: "JetBrains Mono", family: "var(--font-jetbrains), ui-monospace, monospace", group: "mono" },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]["id"];

export const FONT_GROUPS: { id: string; label: string }[] = [
  { id: "sans", label: "Bezserifa" },
  { id: "serif", label: "Serifs" },
  { id: "script", label: "Rokraksts" },
  { id: "mono", label: "Vienplatuma" },
];

export function fontFamilyOf(id: FontId | undefined) {
  return FONT_OPTIONS.find((font) => font.id === id)?.family;
}
