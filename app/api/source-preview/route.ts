import { createClient } from "@/app/lib/supabase/server";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";
import { instagramName, publicHttpUrl, type SourcePreview } from "@/app/lib/source-preview";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ ok: false, message: "Nepieciešama autentifikācija." } satisfies SourcePreview, {
      status: 401,
    });
  }

  const limited = rateLimit(clientKeyFromRequest(request, `source-preview:${user.id}`), 30, 60_000);
  if (!limited.ok) {
    return Response.json({ ok: false, message: "Pārāk daudz pieprasījumu. Mēģini vēlāk." } satisfies SourcePreview, {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

  let body: { kind?: string; value?: string };
  try {
    body = (await request.json()) as { kind?: string; value?: string };
  } catch {
    return Response.json({ ok: false, message: "Nederīgs pieprasījums." } satisfies SourcePreview, { status: 400 });
  }

  if (body.kind === "instagram") {
    const name = instagramName(body.value ?? "");
    if (!name) {
      return Response.json({ ok: false, message: "Ievadi Instagram lietotājvārdu." } satisfies SourcePreview, {
        status: 400,
      });
    }
    return Response.json(await readInstagram(name));
  }

  if (body.kind === "website") {
    const url = publicHttpUrl(body.value ?? "");
    if (!url) {
      return Response.json({ ok: false, message: "Ievadi publisku lapas adresi." } satisfies SourcePreview, {
        status: 400,
      });
    }
    return Response.json(await readWebsite(url));
  }

  return Response.json({ ok: false, message: "Nezināms avots." } satisfies SourcePreview, { status: 400 });
}

async function readInstagram(name: string): Promise<SourcePreview> {
  const embedHtml = await readHtml(`https://www.instagram.com/${encodeURIComponent(name)}/embed/`);
  const embedImages = embedHtml ? extractInstagramDisplayUrls(embedHtml) : [];
  const profileFromEmbed = embedHtml ? extractFirstMatch(embedHtml, /profile_pic_url\\*":\\*"(https:[^"\\]+)/) : null;

  if (embedImages.length > 0 || profileFromEmbed) {
    const image = decodeIgUrl(profileFromEmbed) || embedImages[0] || null;
    return {
      ok: true,
      title: `@${name}`,
      description: `@${name}`,
      image,
      images: embedImages.slice(0, 12),
      links: [],
    };
  }

  const page = await readHtml(`https://www.instagram.com/${encodeURIComponent(name)}/`);
  if (!page) {
    return {
      ok: false,
      message: "Instagram profilu neizdevās nolasīt. Blokā ieraksti rādīsies caur Instagram embed.",
    };
  }
  const title = meta(page, "og:title") || textTitle(page);
  const description = meta(page, "og:description");
  const image = usableImage(meta(page, "og:image"));
  const images = extractInstagramDisplayUrls(page);
  const loginWall = /login|log in|sign up/i.test(title) && !description.toLowerCase().includes(name.toLowerCase());
  if (loginWall && !image && images.length === 0) {
    return {
      ok: false,
      message: "Instagram prasa pieslēgšanos serverim. Publiskajā lapā ieraksti tomēr rādās caur Instagram embed.",
    };
  }
  return {
    ok: true,
    title: title.replace(/\s+•\s+Instagram.*$/i, "").trim() || `@${name}`,
    description,
    image,
    images: images.slice(0, 12),
    links: [],
  };
}

async function readWebsite(url: URL): Promise<SourcePreview> {
  const page = await readHtml(url.toString());
  if (!page) return { ok: false, message: "Šo lapu neizdevās nolasīt." };
  const title = meta(page, "og:title") || textTitle(page);
  const description = meta(page, "og:description") || meta(page, "description");
  const image = usableImage(meta(page, "og:image"));
  return {
    ok: true,
    title,
    description,
    image,
    images: image ? [image] : [],
    links: pageLinks(page, url).slice(0, 4),
  };
}

async function readHtml(target: string) {
  try {
    const response = await fetch(target, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "user-agent": BROWSER_UA,
      },
      cache: "no-store",
    });

    let current = response;
    let hops = 0;
    while (current.status >= 300 && current.status < 400 && hops < 3) {
      const location = current.headers.get("location");
      if (!location) return null;
      const nextUrl = publicHttpUrl(new URL(location, target).toString());
      if (!nextUrl) return null;
      current = await fetch(nextUrl.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": BROWSER_UA,
        },
        cache: "no-store",
      });
      hops += 1;
      target = nextUrl.toString();
    }

    if (!current.ok) return null;
    const finalUrl = publicHttpUrl(current.url || target);
    if (!finalUrl) return null;
    const length = Number(current.headers.get("content-length") ?? "0");
    if (length > 800_000) return null;
    const html = await current.text();
    return html.slice(0, 700_000);
  } catch {
    return null;
  }
}

function extractInstagramDisplayUrls(html: string) {
  const parts = html.split("display_url");
  const found: string[] = [];
  const seen = new Set<string>();
  for (const part of parts.slice(1)) {
    const match = part.match(/https(?::\\+\/\\+\/|:\/\/)[^"\\]+/);
    if (!match) continue;
    const url = decodeIgUrl(match[0]);
    if (!url) continue;
    if (!/scontent|cdninstagram\.com\/v\/|fbcdn\.net/.test(url)) continue;
    const key = url.split("?")[0] ?? url;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push(url);
  }
  return found;
}

function extractFirstMatch(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1] ?? null;
}

function decodeIgUrl(raw: string | null) {
  if (!raw) return null;
  let url = raw;
  for (let i = 0; i < 5; i += 1) {
    const next = url.replace(/\\+\//g, "/");
    if (next === url) break;
    url = next;
  }
  url = url
    .replace(/\\u0026/gi, "&")
    .replace(/\\u00253[Dd]/g, "%3D")
    .replace(/&amp;/g, "&");
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const first = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i");
  const second = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i");
  return decode(html.match(first)?.[1] || html.match(second)?.[1] || "");
}

function textTitle(html: string) {
  return decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
}

function usableImage(value: string) {
  if (!/^https?:\/\//i.test(value)) return null;
  if (/rsrc\.php|static\.cdninstagram\.com\/rsrc/i.test(value)) return null;
  return value;
}

function pageLinks(html: string, pageUrl: URL) {
  const found: { title: string; url: string }[] = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = decode(match[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (title.length < 2 || title.length > 80) continue;
    let href: URL;
    try {
      href = new URL(match[1], pageUrl);
    } catch {
      continue;
    }
    if (href.protocol !== "http:" && href.protocol !== "https:") continue;
    if (href.hostname === pageUrl.hostname && href.pathname === pageUrl.pathname) continue;
    if (found.some((item) => item.url === href.toString())) continue;
    found.push({ title, url: href.toString() });
    if (found.length >= 4) break;
  }
  return found;
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}
