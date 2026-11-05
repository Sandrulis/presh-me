import { LANGUAGE_CODES } from "@/app/lib/i18n/language";
import { marketingLocalizedFirstSegments } from "@/app/lib/seo/localized-slugs";

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$/;

/** Pirmā ceļa daļa no `app/` lapām, API un `public/`. Lietotāja links to nedrīkst aizņemt. */
export const SYSTEM_LINKS = [
  "admin",
  "api",
  "bug",
  "compare",
  "contact",
  "cookies",
  "demos",
  "digital-business-card",
  "favicon",
  "feedback",
  "for",
  "forgot-password",
  "link-in-bio",
  "login",
  "personal-website",
  "portfolio-website",
  "privacy",
  "register",
  "rules",
  "settings",
  "start",
  "studio",
  "suggestions",
  "terms",
  "tools",
  "update-password",
  /** All UI language codes are reserved for `/{locale}` marketing mirrors. */
  ...LANGUAGE_CODES,
] as const;

const EXTRA_RESERVED = [
  ...marketingLocalizedFirstSegments(),
  "app",
  "auth",
  "public",
  "robots",
  "sitemap",
  "www",
  "presh",
  "adrese",
  "alise",
  "asmens",
  "elina",
  "gaisma",
  "garaza",
  "kafe",
  "karlis",
  "klets",
  "mara",
  "masieris",
  "niks",
  "otto",
  "ozols",
  "paraugs",
  "remonts",
  "rihards",
  "sabine",
  "skaistums",
  "zobarsts",
];

export const RESERVED_HANDLES = new Set<string>([...SYSTEM_LINKS, ...EXTRA_RESERVED]);

const SYSTEM_PATH_SEGMENTS = new Set<string>(SYSTEM_LINKS);

/** Single-segment URL served by `app/[handle]` (demos + live pages), not a system route. */
export function isPublicProfilePathname(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment || pathname.split("/").filter(Boolean).length !== 1) return false;
  if (!isHandleFormat(segment)) return false;
  return !SYSTEM_PATH_SEGMENTS.has(segment);
}

export function normalizeHandle(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function isHandleFormat(handle: string) {
  return HANDLE_RE.test(handle);
}

export const LINK_UNAVAILABLE = "Šāds links nav pieejams.";

export function handleError(handle: string) {
  if (!handle) return "Ievadi linku.";
  if (handle.length < 3) return "Linkam jābūt vismaz 3 simboliem.";
  if (handle.length > 24) return "Linkam jābūt līdz 24 simboliem.";
  if (!isHandleFormat(handle)) return "Tikai mazie burti, cipari un defise.";
  if (RESERVED_HANDLES.has(handle)) return "Šis links ir rezervēts.";
  return null;
}

export function pastedLink(value: string) {
  const raw = value.trim();
  return /^https?:\/\//i.test(raw) || /presh\.me/i.test(raw) || raw.includes("/") || raw.includes(".");
}

export function linkFieldError(raw: string) {
  const value = raw.trim();
  if (!value) return "Ievadi linku.";
  if (pastedLink(value)) return LINK_UNAVAILABLE;
  const invalid = handleError(normalizeHandle(value));
  if (invalid === "Šis links ir rezervēts.") return LINK_UNAVAILABLE;
  return invalid;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
