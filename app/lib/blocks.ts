import type {
  BlockType,
  FaqBlockItem,
  PageBlock,
  ResumeItem,
} from "@/app/lib/types";

export const BLOCK_TYPE_OPTIONS: {
  id: BlockType;
  label: string;
  hint: string;
}[] = [
  { id: "link", label: "Saite", hint: "Poga ar nosaukumu un URL" },
  { id: "text", label: "Teksts", hint: "Brīvs teksts ar stilu" },
  { id: "youtube", label: "YouTube", hint: "Video no YouTube saites" },
  { id: "image", label: "Attēls", hint: "Viens attēls lapā" },
  { id: "audio", label: "Audio", hint: "Spotify ieraksts vai playlists" },
  { id: "resume", label: "Resumē", hint: "Laika josla ar sasniegumiem" },
  { id: "instagram", label: "Instagram", hint: "Bildžu režģis no ierakstu saitēm" },
  { id: "quote", label: "Citāts", hint: "Izcelts citāts" },
  { id: "faq", label: "FAQ", hint: "Jautājumi un atbildes" },
];

export function emptyBlock(type: BlockType): PageBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "link":
      return { id, type: "link", title: "", url: "", note: "", borderRadius: 8 };
    case "text":
      return { id, type: "text", body: "", align: "center", fontSize: 14 };
    case "youtube":
      return { id, type: "youtube", url: "", title: "", borderRadius: 12, borderWidth: 0, borderColor: "#111111" };
    case "image":
      return { id, type: "image", src: null, alt: "", borderRadius: 12, borderWidth: 0, borderColor: "#111111" };
    case "audio":
      return { id, type: "audio", url: "", borderRadius: 12, borderWidth: 0, borderColor: "#111111" };
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
  }
}

export function emptyResumeItem(): ResumeItem {
  return { id: crypto.randomUUID(), date: "", title: "", description: "" };
}

export function emptyFaqItem(): FaqBlockItem {
  return { id: crypto.randomUUID(), question: "", answer: "" };
}

export function blockTypeLabel(type: BlockType) {
  return BLOCK_TYPE_OPTIONS.find((item) => item.id === type)?.label ?? type;
}

export function blockIsComplete(block: PageBlock): boolean {
  switch (block.type) {
    case "link":
      return Boolean(block.title.trim() && block.url.trim());
    case "text":
      return Boolean(block.body.trim());
    case "youtube":
      return Boolean(youtubeVideoId(block.url));
    case "image":
      return Boolean(block.src);
    case "audio":
      return Boolean(spotifyEmbedUrl(block.url));
    case "resume":
      return block.items.some((item) => item.date.trim() && item.title.trim());
    case "instagram":
      return block.images.filter(Boolean).length > 0;
    case "quote":
      return Boolean(block.text.trim());
    case "faq":
      return block.items.some((item) => item.question.trim());
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
    case "youtube":
      return block.title?.trim() || "YouTube";
    case "image":
      return block.alt.trim() || "Attēls";
    case "audio":
      return "Spotify";
    case "resume":
      return block.heading?.trim() || "Resumē";
    case "instagram":
      return block.username.trim() ? `@${block.username.replace(/^@/, "")}` : "Instagram";
    case "quote": {
      const text = block.text.trim();
      if (!text) return "Citāts";
      return text.length > 40 ? `${text.slice(0, 40)}…` : text;
    }
    case "faq":
      return `FAQ (${block.items.length})`;
  }
}

export function blockDisplayHint(block: PageBlock) {
  switch (block.type) {
    case "link":
      return block.url.trim() || block.note.trim() || "Saite";
    case "text":
      return "Teksta bloks";
    case "youtube":
      return block.url.trim() || "YouTube video";
    case "image":
      return block.src ? "Attēls" : "Nav attēla";
    case "audio":
      return block.url.trim() || "Spotify";
    case "resume":
      return `${block.items.length} ieraksti`;
    case "instagram":
      return `${block.images.length}/${block.count} bildes · ${block.columns} kolonnas`;
    case "quote":
      return block.author?.trim() || "Citāts";
    case "faq":
      return "Jautājumi un atbildes";
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

/** Spotify track / album / playlist / episode → embed URL. */
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
