export type Theme = {
  id: string;
  name: string;
  background: string;
  text: string;
  muted: string;
  button: string;
  buttonText: string;
  accent: string;
  buttonBorder?: string;
  backgroundImage?: string;
  overlay?: string;
};

export const themes: Theme[] = [
  {
    id: "stamp",
    name: "Tīrs",
    background: "#f4f6f8",
    text: "#0e1116",
    muted: "#5d6672",
    button: "#0e1116",
    buttonText: "#f4f6fb",
    accent: "#2f5bff",
  },
  {
    id: "night",
    name: "Nakts",
    background: "#090b10",
    text: "#f4f6fb",
    muted: "#a7b0bd",
    button: "#f4f6fb",
    buttonText: "#090b10",
    accent: "#7aa2ff",
  },
  {
    id: "grove",
    name: "Signāls",
    background: "linear-gradient(180deg, #121826 0%, #0b1020 100%)",
    text: "#f5f7ff",
    muted: "#b7c0d4",
    button: "#d6ff4a",
    buttonText: "#12180a",
    accent: "#d6ff4a",
  },
  {
    id: "tide",
    name: "Ledus",
    background: "linear-gradient(180deg, #e7eeff 0%, #f7f8fb 100%)",
    text: "#121826",
    muted: "#516079",
    button: "#2450ff",
    buttonText: "#f7f8ff",
    accent: "#2450ff",
  },
  {
    id: "bloom",
    name: "Violetā",
    background: "#f4f1fb",
    text: "#1b1430",
    muted: "#6d6284",
    button: "#1b1430",
    buttonText: "#f6f3ff",
    accent: "#7c5cff",
  },
  {
    id: "studio",
    name: "Kontūra",
    background: "#ffffff",
    text: "#111111",
    muted: "#5e5e5e",
    button: "#ffffff",
    buttonText: "#111111",
    accent: "#111111",
    buttonBorder: "#d9d9d9",
  },
];

const themeCatalog = new Map(themes.map((theme) => [theme.id, theme]));

export function registerThemes(extra: Theme[]) {
  for (const theme of extra) themeCatalog.set(theme.id, theme);
}

export function getTheme(themeId: string) {
  return themeCatalog.get(themeId) ?? themes[0];
}
