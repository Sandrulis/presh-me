import type { Portfolio } from "@/app/lib/types";
import { registerThemes, type Theme } from "@/app/lib/themes";

export type DemoProfile = {
  role: string;
  page: Portfolio;
  theme: Theme;
};

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

const stamp = "2026-01-01T00:00:00.000Z";

function demo(
  handle: string,
  role: string,
  displayName: string,
  bio: string,
  theme: Theme,
  socials: Portfolio["socials"],
  blocks: Portfolio["blocks"],
  avatarUrl: string | null = null,
): DemoProfile {
  return {
    role,
    theme,
    page: {
      id: `demo-${handle}`,
      accountId: "example",
      handle,
      displayName,
      bio,
      avatarUrl,
      themeId: theme.id,
      published: true,
      socials,
      blocks,
      createdAt: stamp,
      updatedAt: stamp,
    },
  };
}

export const demos: DemoProfile[] = [
  demo(
    "mara",
    "Fotogrāfe",
    "Māra Liepa",
    "Portreti, klusas vietas un īsi stāsti.",
    {
      id: "demo-mara",
      name: "Māra",
      background: "#10141c",
      text: "#f5f7ff",
      muted: "#b7c0d4",
      button: "#d6ff4a",
      buttonText: "#12180a",
      accent: "#d6ff4a",
      backgroundImage: "/demos/mara-bg.jpg",
      overlay: "rgba(10,14,22,0.58)",
    },
    [
      { id: "mara-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "mara-mail", platform: "email", url: "mara@example.com" },
    ],
    [
      { id: "mara-1", type: "link", title: "Jaunākā sērija", url: "https://example.com/serija", note: "Rudens pie jūras" },
      { id: "mara-2", type: "link", title: "Rezervēt sesiju", url: "https://example.com/rezervet", note: "" },
    ],
    "/demos/mara-avatar.jpg",
  ),
  demo(
    "karlis",
    "Arhitekts",
    "Kārlis Bērziņš",
    "Mājas, telpas un detaļas, kas paliek.",
    {
      id: "demo-karlis",
      name: "Kārlis",
      background: "#f3f3f1",
      text: "#111111",
      muted: "#5c5c5c",
      button: "#111111",
      buttonText: "#f7f7f5",
      accent: "#111111",
      backgroundImage: "/demos/karlis-bg.jpg",
      overlay: "rgba(243,243,241,0.82)",
    },
    [
      { id: "karlis-web", platform: "website", url: "https://example.com" },
      { id: "karlis-in", platform: "linkedin", url: "https://linkedin.com" },
    ],
    [
      { id: "karlis-1", type: "link", title: "Projekti", url: "https://example.com/projekti", note: "2024-2026" },
      { id: "karlis-2", type: "link", title: "Birojs", url: "https://example.com/birojs", note: "" },
    ],
  ),
  demo(
    "alise",
    "Mūziķe",
    "Alise Romanova",
    "Jaunais albums un koncerti šoruden.",
    {
      id: "demo-alise",
      name: "Alise",
      background: "linear-gradient(180deg, #241433 0%, #120816 100%)",
      text: "#f6f0ff",
      muted: "#cbbde0",
      button: "#efe6ff",
      buttonText: "#1a1024",
      accent: "#c4a6ff",
    },
    [
      { id: "alise-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "alise-yt", platform: "youtube", url: "https://youtube.com" },
    ],
    [
      { id: "alise-1", type: "link", title: "Klausīties albumu", url: "https://example.com/albums", note: "Klusā pilsēta" },
      { id: "alise-2", type: "link", title: "Koncertu kalendārs", url: "https://example.com/koncerti", note: "" },
    ],
    "/demos/alise-avatar.jpg",
  ),
  demo(
    "rihards",
    "Šefpavārs",
    "Rihards Kalns",
    "Vakariņas, meistarklases un sezona.",
    {
      id: "demo-rihards",
      name: "Rihards",
      background: "#1a120e",
      text: "#f8f1e8",
      muted: "#d2c3b4",
      button: "#f3e6d4",
      buttonText: "#1a120e",
      accent: "#e7b089",
      backgroundImage: "/demos/rihards-bg.jpg",
      overlay: "rgba(20,12,8,0.62)",
    },
    [
      { id: "rihards-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "rihards-mail", platform: "email", url: "rihards@example.com" },
    ],
    [
      { id: "rihards-1", type: "link", title: "Rezervēt galdu", url: "https://example.com/galds", note: "Ceturtdienas" },
      { id: "rihards-2", type: "link", title: "Ēdienkarte", url: "https://example.com/karte", note: "" },
    ],
    "/demos/rihards-avatar.jpg",
  ),
  demo(
    "elina",
    "Dizainere",
    "Elīna Vītola",
    "Lietas, ko gribas paņemt rokā.",
    {
      id: "demo-elina",
      name: "Elīna",
      background: "linear-gradient(180deg, #e7eeff 0%, #f7f8fb 100%)",
      text: "#121826",
      muted: "#516079",
      button: "#2450ff",
      buttonText: "#f7f8ff",
      accent: "#2450ff",
      backgroundImage: "/demos/elina-bg.jpg",
      overlay: "rgba(247,248,251,0.78)",
    },
    [
      { id: "elina-web", platform: "website", url: "https://example.com" },
      { id: "elina-ig", platform: "instagram", url: "https://instagram.com" },
    ],
    [
      { id: "elina-1", type: "link", title: "Portfolio", url: "https://example.com/darbi", note: "12 projekti" },
      { id: "elina-2", type: "link", title: "Sadarbības", url: "https://example.com/sadarbiba", note: "" },
    ],
  ),
  demo(
    "otto",
    "Izstrādātājs",
    "Otto Lejiņš",
    "Saskarnes un mazas sistēmas.",
    {
      id: "demo-otto",
      name: "Otto",
      background: "#090909",
      text: "#f5f5f5",
      muted: "#a3a3a3",
      button: "transparent",
      buttonText: "#f5f5f5",
      accent: "#f5f5f5",
      buttonBorder: "rgba(255,255,255,0.35)",
    },
    [
      { id: "otto-gh", platform: "github", url: "https://github.com" },
      { id: "otto-web", platform: "website", url: "https://example.com" },
    ],
    [
      { id: "otto-1", type: "link", title: "Atvērtie projekti", url: "https://example.com/projekti", note: "" },
      { id: "otto-2", type: "link", title: "Pieejams jaunam darbam", url: "https://example.com/kontakts", note: "No novembra" },
    ],
    "/demos/otto-avatar.jpg",
  ),
  demo(
    "sabine",
    "Rakstniece",
    "Sabīne Krūmiņa",
    "Esejas un jaunā grāmata.",
    {
      id: "demo-sabine",
      name: "Sabīne",
      background: "#f6f1ea",
      text: "#1c1612",
      muted: "#6f6258",
      button: "#1c1612",
      buttonText: "#f6f1ea",
      accent: "#c4553a",
    },
    [
      { id: "sabine-web", platform: "website", url: "https://example.com" },
      { id: "sabine-mail", platform: "email", url: "sabine@example.com" },
    ],
    [
      { id: "sabine-1", type: "link", title: "Jaunā grāmata", url: "https://example.com/gramata", note: "Klusie pagalmi" },
      { id: "sabine-2", type: "link", title: "Lasījumi", url: "https://example.com/lasijumi", note: "" },
    ],
    "/demos/sabine-avatar.jpg",
  ),
  demo(
    "niks",
    "Treneris",
    "Niks Auziņš",
    "Spēks, ritms un skaidrs plāns.",
    {
      id: "demo-niks",
      name: "Niks",
      background: "linear-gradient(180deg, #123024 0%, #0b1c16 100%)",
      text: "#f3fff6",
      muted: "#c5ddd0",
      button: "#e7ffe8",
      buttonText: "#10241a",
      accent: "#b6f25c",
      backgroundImage: "/demos/niks-bg.jpg",
      overlay: "rgba(8,24,16,0.55)",
    },
    [
      { id: "niks-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "niks-tt", platform: "tiktok", url: "https://tiktok.com" },
    ],
    [
      { id: "niks-1", type: "link", title: "Treniņu plāns", url: "https://example.com/plans", note: "4 nedēļas" },
      { id: "niks-2", type: "link", title: "Pieteikties", url: "https://example.com/pieteikties", note: "" },
    ],
    "/demos/niks-avatar.jpg",
  ),
  demo(
    "klets",
    "Ēdinātājs",
    "Klēts",
    "Kāzas, biroja pusdienas un galds pie jūras.",
    {
      id: "demo-klets",
      name: "Klēts",
      background: "#2a2118",
      text: "#fff8f3",
      muted: "#e6d5c4",
      button: "#c4552a",
      buttonText: "#fff8f3",
      accent: "#c4552a",
      backgroundImage: "/demos/klets-bg.jpg",
      overlay: "rgba(32,22,14,0.55)",
    },
    [
      { id: "klets-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "klets-mail", platform: "email", url: "klets@example.com" },
    ],
    [
      { id: "klets-1", type: "link", title: "Ēdienkarte", url: "https://example.com/karte", note: "Sezona" },
      { id: "klets-2", type: "link", title: "Pieteikt pasākumu", url: "https://example.com/pasakums", note: "" },
    ],
    "/demos/klets-logo.jpg",
  ),
  demo(
    "asmens",
    "Bārberis",
    "Asmens",
    "Griezums, bārda un kluss rīts pirms darba.",
    {
      id: "demo-asmens",
      name: "Asmens",
      background: "#141816",
      text: "#f6f3ec",
      muted: "#b7b2a6",
      button: "#e4c56a",
      buttonText: "#1a160c",
      accent: "#e4c56a",
      backgroundImage: "/demos/asmens-bg.jpg",
      overlay: "rgba(10,14,12,0.58)",
    },
    [
      { id: "asmens-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "asmens-web", platform: "website", url: "https://example.com" },
    ],
    [
      { id: "asmens-1", type: "link", title: "Pieraksts", url: "https://example.com/pieraksts", note: "Šodien brīvs" },
      { id: "asmens-2", type: "link", title: "Cenas", url: "https://example.com/cenas", note: "" },
    ],
    "/demos/asmens-logo.jpg",
  ),
  demo(
    "gaisma",
    "Fotostudija",
    "Gaisma",
    "Studija portretiem, produktiem un komandām.",
    {
      id: "demo-gaisma",
      name: "Gaisma",
      background: "#f4f6f8",
      text: "#121418",
      muted: "#5d6672",
      button: "#121418",
      buttonText: "#f7f8fa",
      accent: "#121418",
      backgroundImage: "/demos/gaisma-bg.jpg",
      overlay: "rgba(247,248,250,0.62)",
    },
    [
      { id: "gaisma-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "gaisma-web", platform: "website", url: "https://example.com" },
    ],
    [
      { id: "gaisma-1", type: "link", title: "Zāles noma", url: "https://example.com/zale", note: "Dienas gaisma" },
      { id: "gaisma-2", type: "link", title: "Cenas un laiki", url: "https://example.com/laiki", note: "" },
    ],
    "/demos/gaisma-logo.jpg",
  ),
  demo(
    "garaza",
    "Autoserviss",
    "Garāža",
    "Riepas, eļļa un diagnostika tajā pašā dienā.",
    {
      id: "demo-garaza",
      name: "Garāža",
      background: "#1b2430",
      text: "#f4f7fb",
      muted: "#c5ced8",
      button: "#d7e6ff",
      buttonText: "#101820",
      accent: "#8eb6ff",
      backgroundImage: "/demos/garaza-bg.jpg",
      overlay: "rgba(12,18,28,0.62)",
    },
    [
      { id: "garaza-ig", platform: "instagram", url: "https://instagram.com" },
      { id: "garaza-web", platform: "website", url: "https://example.com" },
    ],
    [
      { id: "garaza-1", type: "link", title: "Pieraksts", url: "https://example.com/pieraksts", note: "Šodien" },
      { id: "garaza-2", type: "link", title: "Cenas", url: "https://example.com/cenas", note: "" },
    ],
    "/demos/garaza-logo.jpg",
  ),
  demo(
    "ozols",
    "Ražotne",
    "Ozols",
    "Mēbeles un ozola detaļas pēc pasūtījuma.",
    {
      id: "demo-ozols",
      name: "Ozols",
      background: "#3a2418",
      text: "#f8f1e6",
      muted: "#e2d0bc",
      button: "#f3e6d4",
      buttonText: "#2a1a12",
      accent: "#e7b089",
      backgroundImage: "/demos/ozols-bg.jpg",
      overlay: "rgba(28,16,10,0.55)",
    },
    [
      { id: "ozols-web", platform: "website", url: "https://example.com" },
      { id: "ozols-mail", platform: "email", url: "ozols@example.com" },
    ],
    [
      { id: "ozols-1", type: "link", title: "Katalogs", url: "https://example.com/katalogs", note: "Ozols" },
      { id: "ozols-2", type: "link", title: "Pasūtījums", url: "https://example.com/pasutijums", note: "" },
    ],
    "/demos/ozols-logo.jpg",
  ),
];

registerThemes(demos.map((item) => item.theme));

const byHandle = new Map(demos.map((item) => [item.page.handle, item.page]));

const mara = demos[0]?.page;

export function getExample(handle: string) {
  if (handle === "paraugs" && mara) return { ...mara, handle: "paraugs" };
  return byHandle.get(handle) ?? null;
}

/** Apply UI-language copy to a demo profile (role, bio, link titles/notes). */
export function localizeDemoProfile(demo: DemoProfile, t: TranslateFn): DemoProfile {
  const handle = demo.page.handle;
  const prefix = `demo.${handle}`;
  const blocks = demo.page.blocks.map((block, index) => {
    if (block.type !== "link") return block;
    const n = index + 1;
    return {
      ...block,
      title: t(`${prefix}.l${n}.title`, block.title),
      note: block.note ? t(`${prefix}.l${n}.note`, block.note) : block.note,
    };
  });
  return {
    role: t(`${prefix}.role`, demo.role),
    theme: demo.theme,
    page: {
      ...demo.page,
      displayName: t(`${prefix}.name`, demo.page.displayName),
      bio: t(`${prefix}.bio`, demo.page.bio),
      blocks,
    },
  };
}

export function localizeDemoPage(page: Portfolio, t: TranslateFn): Portfolio {
  const sourceHandle = page.handle === "paraugs" ? "mara" : page.handle;
  const demo = demos.find((item) => item.page.handle === sourceHandle);
  if (!demo) return page;
  const localized = localizeDemoProfile(demo, t);
  return { ...localized.page, handle: page.handle, id: page.id };
}

export function localizeDemos(t: TranslateFn): DemoProfile[] {
  return demos.map((demo) => localizeDemoProfile(demo, t));
}
