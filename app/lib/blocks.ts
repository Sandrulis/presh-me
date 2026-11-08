import type {
  BlockType,
  BookingBlock,
  FaqBlockItem,
  PollOption,
  SkillItem,
  PageBlock,
  PageContent,
  ResumeItem,
} from "@/app/lib/types";
import { countdownIsConfigured } from "@/app/lib/countdown-block";
import { googleMapsEmbedUrl, isGoogleMapsShortLink, mapsBlockUrlAccepted } from "@/app/lib/google-maps-embed";
import { isValidLinkUrl } from "@/app/lib/urls";

export const BLOCK_TYPE_OPTIONS: {
  id: BlockType;
  label: string;
  hint: string;
}[] = [
  { id: "link", label: "Linki", hint: "Poga ar nosaukumu un URL" },
  { id: "text", label: "Teksts", hint: "Brīvs teksts ar stilu" },
  { id: "video", label: "Video", hint: "YouTube, Vimeo vai TikTok" },
  { id: "image", label: "Attēls", hint: "Viens attēls lapā" },
  { id: "audio", label: "Audio", hint: "Spotify ieraksts vai playlists" },
  { id: "maps", label: "Google karte", hint: "Atrašanās vieta ar karti" },
  { id: "resume", label: "Resumē", hint: "Laika josla ar sasniegumiem" },
  { id: "instagram", label: "Instagram", hint: "Bildžu režģis no ierakstu saitēm" },
  { id: "quote", label: "Citāts", hint: "Izcelts citāts" },
  { id: "skills", label: "Prasmes", hint: "Prasmju saraksts ar vērtējumu" },
  { id: "countdown", label: "Atpakaļskaitīšana", hint: "Taimeris līdz datumam vai ilgumam" },
  { id: "poll", label: "Aptauja", hint: "Jautājums ar atbilžu variantiem" },
  { id: "faq", label: "FAQ", hint: "Jautājumi un atbildes" },
  { id: "booking", label: "Booking", hint: "Darba laiki un rezervācijas poga" },
];

export function emptyBlock(type: BlockType): PageBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "link":
      return { id, type: "link", title: "", url: "", note: "", borderRadius: 8 };
    case "text":
      return { id, type: "text", body: "", align: "center", fontSize: 14 };
    case "video":
      return { id, type: "video", url: "", title: "", borderRadius: 12, borderWidth: 0, borderColor: "#111111" };
    case "image":
      return { id, type: "image", src: null, alt: "", borderRadius: 12, borderWidth: 0, borderColor: "#111111" };
    case "audio":
      return { id, type: "audio", url: "", borderRadius: 12, borderWidth: 0, borderColor: "#111111" };
    case "maps":
      return {
        id,
        type: "maps",
        url: "",
        title: "",
        height: 280,
        borderRadius: 12,
        borderWidth: 0,
        borderColor: "#111111",
      };
    case "resume":
      return {
        id,
        type: "resume",
        heading: "",
        items: [],
        lineColor: "#c5ccd6",
        lineWidth: 1,
        circleColor: "#111111",
        circleSize: 32,
        fontId: "sans",
        fontSize: 14,
      };
    case "instagram":
      return { id, type: "instagram", username: "", columns: 3, count: 6, images: [] };
    case "quote":
      return { id, type: "quote", text: "", author: "", align: "center", fontSize: 18 };
    case "skills":
      return {
        id,
        type: "skills",
        heading: "",
        items: [],
        borderRadius: 8,
        starColor: "#f59e0b",
        fontSize: 14,
      };
    case "countdown":
      return {
        id,
        type: "countdown",
        title: "",
        description: "",
        endMode: "datetime",
        endsAt: "",
        durationHours: 0,
        durationMinutes: 30,
        startsAt: new Date().toISOString(),
        borderRadius: 8,
      };
    case "poll":
      return {
        id,
        type: "poll",
        question: "",
        options: [emptyPollOption(), emptyPollOption()],
        borderRadius: 8,
        progressColor: "#111111",
      };
    case "faq":
      return {
        id,
        type: "faq",
        items: [],
        backgroundColor: "#f4f6fb",
        borderRadius: 8,
        questionFontSize: 15,
        answerFontSize: 14,
      };
    case "booking":
      return {
        id,
        type: "booking",
        buttonText: "",
        buttonColor: "#111111",
        buttonBorderRadius: 8,
        workDays: [1, 2, 3, 4, 5],
        dayStart: "09:00",
        dayEnd: "17:00",
        sessionMinutes: 60,
        horizonDays: 42,
      };
  }
}

export function emptyResumeItem(): ResumeItem {
  return { id: crypto.randomUUID(), date: "", title: "", description: "" };
}

export function emptyFaqItem(): FaqBlockItem {
  return { id: crypto.randomUUID(), question: "", answer: "" };
}

export function emptyPollOption(): PollOption {
  return { id: crypto.randomUUID(), label: "" };
}

export function emptySkillItem(): SkillItem {
  return { id: crypto.randomUUID(), name: "", rating: 0 };
}

export function clampSkillRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.round(value)));
}

export function blockTypeLabel(type: BlockType) {
  return BLOCK_TYPE_OPTIONS.find((item) => item.id === type)?.label ?? type;
}

export function blockIsComplete(block: PageBlock): boolean {
  switch (block.type) {
    case "link":
      return Boolean(block.title.trim() && isValidLinkUrl(block.url));
    case "text":
      return Boolean(block.body.trim());
    case "video":
      return Boolean(videoEmbedUrl(block.url));
    case "image":
      return Boolean(block.src);
    case "audio":
      return Boolean(spotifyEmbedUrl(block.url));
    case "maps":
      return Boolean(
        googleMapsEmbedUrl(block.url) || block.embedSrc?.trim() || isGoogleMapsShortLink(block.url),
      );
    case "resume":
      return block.items.some((item) => item.date.trim() && item.title.trim());
    case "instagram":
      return block.images.filter(Boolean).length > 0;
    case "quote":
      return Boolean(block.text.trim());
    case "skills":
      return block.items.some((item) => item.name.trim());
    case "countdown":
      return Boolean(block.title.trim() && countdownIsConfigured(block));
    case "poll":
      return Boolean(block.question.trim() && block.options.filter((o) => o.label.trim()).length >= 2);
    case "faq":
      return block.items.some((item) => item.question.trim());
    case "booking":
      return true;
  }
}

export function blockDisplayTitle(block: PageBlock) {
  switch (block.type) {
    case "link":
      return block.title.trim() || "Saite";
    case "text": {
      const body = block.body.trim();
      if (!body) return "Teksts";
      return body.length > 40 ? `${body.slice(0, 40)}…` : body;
    }
    case "video":
      return block.title?.trim() || "Video";
    case "image":
      return block.alt.trim() || "Attēls";
    case "audio":
      return "Spotify";
    case "maps":
      return block.title?.trim() || "Google karte";
    case "resume":
      return block.heading?.trim() || "Resumē";
    case "instagram":
      return block.username.trim() ? `@${block.username.replace(/^@/, "")}` : "Instagram";
    case "quote": {
      const text = block.text.trim();
      if (!text) return "Citāts";
      return text.length > 40 ? `${text.slice(0, 40)}…` : text;
    }
    case "skills":
      return block.heading?.trim() || "Prasmes";
    case "countdown":
      return block.title.trim() || "Atpakaļskaitīšana";
    case "poll": {
      const q = block.question.trim();
      if (!q) return "Aptauja";
      return q.length > 40 ? `${q.slice(0, 40)}…` : q;
    }
    case "faq":
      return `FAQ (${block.items.length})`;
    case "booking":
      return block.buttonText?.trim() || "Booking";
  }
}

export function blockDisplayHint(block: PageBlock) {
  switch (block.type) {
    case "link":
      if (block.url.trim() && !isValidLinkUrl(block.url)) return "Nederīga saite";
      return block.url.trim() || block.note.trim() || "Saite";
    case "text":
      return "Teksta bloks";
    case "video":
      return block.url.trim() || "Video";
    case "image":
      return block.src ? "Attēls" : "Nav attēla";
    case "audio":
      return block.url.trim() || "Spotify";
    case "maps":
      if (block.url.trim() && !mapsBlockUrlAccepted(block.url, block.embedSrc)) return "Nederīga karte";
      return block.url.trim() || "Google Maps";
    case "resume":
      return `${block.items.length} ieraksti`;
    case "instagram":
      return `${block.images.length}/${block.count} bildes · ${block.columns} kolonnas`;
    case "quote":
      return block.author?.trim() || "Citāts";
    case "skills":
      return `${block.items.length} prasmes`;
    case "countdown":
      return block.endMode === "datetime"
        ? block.endsAt?.trim() || "Datums"
        : `${block.durationHours ?? 0} h ${block.durationMinutes ?? 0} min`;
    case "poll":
      return `${block.options.filter((o) => o.label.trim()).length} varianti`;
    case "faq":
      return "Jautājumi un atbildes";
    case "booking":
      return "Darba laiki un rezervācijas poga";
  }
}

/** YouTube watch / youtu.be / embed / shorts → video id. */
export function youtubeVideoId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && /^[\w-]{6,}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      if ((parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") && parts[1] && /^[\w-]{6,}$/.test(parts[1])) {
        return parts[1];
      }
    }
  } catch {
    if (/^[\w-]{11}$/.test(value)) return value;
  }
  return null;
}

export function youtubeEmbedUrl(raw: string): string | null {
  const id = youtubeVideoId(raw);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function vimeoVideoId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const videoIdx = parts.indexOf("video");
    const id = (videoIdx >= 0 ? parts[videoIdx + 1] : parts[0])?.split("?")[0];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function vimeoEmbedUrl(raw: string): string | null {
  const id = vimeoVideoId(raw);
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

export function tiktokVideoId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.includes("tiktok.com")) return null;
    const fromPath = url.pathname.match(/\/video\/(\d+)/);
    if (fromPath?.[1]) return fromPath[1];
    const fromEmbed = url.pathname.match(/\/embed\/v\d\/(\d+)/);
    if (fromEmbed?.[1]) return fromEmbed[1];
  } catch {
    return null;
  }
  return null;
}

export function tiktokEmbedUrl(raw: string): string | null {
  const id = tiktokVideoId(raw);
  return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
}

export type VideoEmbedProvider = "youtube" | "vimeo" | "tiktok";

export function videoEmbedUrl(raw: string): { src: string; provider: VideoEmbedProvider } | null {
  const youtube = youtubeEmbedUrl(raw);
  if (youtube) return { src: youtube, provider: "youtube" };
  const vimeo = vimeoEmbedUrl(raw);
  if (vimeo) return { src: vimeo, provider: "vimeo" };
  const tiktok = tiktokEmbedUrl(raw);
  if (tiktok) return { src: tiktok, provider: "tiktok" };
  return null;
}

export { googleMapsEmbedUrl, isGoogleMapsShortLink, mapsBlockUrlAccepted } from "@/app/lib/google-maps-embed";

export function spotifyEmbedUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "open.spotify.com" && host !== "spotify.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const kind = parts[0];
    const id = parts[1]?.split("?")[0];
    if (!kind || !id) return null;
    if (!["track", "album", "playlist", "episode", "show", "artist"].includes(kind)) return null;
    return `https://open.spotify.com/embed/${kind}/${id}`;
  } catch {
    return null;
  }
}

export function instagramHandle(username: string): string {
  const trimmed = username.trim().replace(/^@/, "");
  const fromUrl = trimmed.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return ((fromUrl?.[1] ?? trimmed).split(/[/?#]/)[0] ?? "").replace(/\/$/, "");
}

export function instagramProfileUrl(username: string): string {
  const handle = instagramHandle(username);
  if (!handle) return "https://instagram.com/";
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://instagram.com/${handle}`;
}

/** Izvelk ieraksta shortcode no /p/ vai /reel/ saites. */
export function instagramPostShortcode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (match?.[1]) return match[1];
  if (/^[A-Za-z0-9_-]{5,}$/.test(trimmed)) return trimmed;
  return null;
}

/** Tieša attēla saite (bez profila galvenes) — browser follows redirect uz CDN. */
export function instagramPostMediaUrl(raw: string, size: "t" | "m" | "l" = "l"): string | null {
  const code = instagramPostShortcode(raw);
  if (!code) return null;
  return `https://www.instagram.com/p/${encodeURIComponent(code)}/media/?size=${size}`;
}

export function instagramPostPageUrl(raw: string): string | null {
  const code = instagramPostShortcode(raw);
  if (!code) return null;
  return `https://www.instagram.com/p/${encodeURIComponent(code)}/`;
}

/** No teksta (rindas) izveido unikālus media URL līdz limitam. */
export function instagramMediaUrlsFromText(text: string, limit: number): string[] {
  const max = Math.min(12, Math.max(1, limit));
  const found: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/[\n,]+/)) {
    const media = instagramPostMediaUrl(line);
    if (!media) continue;
    const code = instagramPostShortcode(line);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    found.push(media);
    if (found.length >= max) break;
  }
  return found;
}

export async function readImageFile(
  file: File | undefined,
  onUrl: (url: string) => void,
  onError: (message: string) => void,
) {
  const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
  const result = await processAndUploadImage(file, { mode: "fit", maxEdge: 1400, folder: "blocks" });
  if (!result.ok) {
    onError(result.error);
    return;
  }
  onUrl(result.url);
}

const PAGE_BLOCK_TYPES = new Set<BlockType>([
  "link",
  "text",
  "video",
  "image",
  "audio",
  "maps",
  "resume",
  "instagram",
  "quote",
  "skills",
  "countdown",
  "poll",
  "faq",
  "booking",
]);

function coercePageBlock(value: unknown): PageBlock | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = record.id;
  const type = record.type;
  if (typeof id !== "string" || !id.trim()) return null;
  if (type === "youtube") {
    return { ...record, id, type: "video" } as PageBlock;
  }
  if (typeof type === "string" && PAGE_BLOCK_TYPES.has(type as BlockType)) {
    return record as PageBlock;
  }
  return null;
}

export function legacyContentToBookingBlock(content: Partial<PageContent>): BookingBlock {
  return {
    id: crypto.randomUUID(),
    type: "booking",
    buttonText: content.bookingButtonText,
    buttonColor: content.bookingButtonColor,
    buttonBorderRadius: content.bookingButtonBorderRadius,
    workDays: content.bookingWorkDays,
    dayStart: content.bookingDayStart,
    dayEnd: content.bookingDayEnd,
    sessionMinutes: content.bookingSessionMinutes,
    horizonDays: content.bookingHorizonDays,
  };
}

/** Validē blokus; veco bookingEnabled migrē uz booking bloku. */
export function normalizePageBlocks(content: Partial<PageContent>): PageBlock[] {
  const raw = Array.isArray(content.blocks) ? content.blocks : [];
  const blocks: PageBlock[] = [];
  for (const item of raw) {
    const block = coercePageBlock(item);
    if (block) blocks.push(block);
  }
  if (!blocks.some((block) => block.type === "booking") && content.bookingEnabled === true) {
    blocks.push(legacyContentToBookingBlock(content));
  }
  return blocks;
}
