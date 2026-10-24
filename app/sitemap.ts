import type { MetadataRoute } from "next";
import { demos } from "@/app/lib/demos";
import { getIndexableSeoLocales } from "@/app/lib/seo/locale-completeness";
import { absoluteLocaleUrl, DEFAULT_SEO_LOCALE } from "@/app/lib/seo/locale-path";
import { absoluteUrl, getPublicSiteUrl } from "@/app/lib/site-url";
import { createClient } from "@/app/lib/supabase/server";

const STATIC_PATHS = [
  "/",
  "/portfolio-website",
  "/digital-business-card",
  "/personal-website",
  "/for/photographers",
  "/for/designers",
  "/for/barbers",
  "/for/beauty-professionals",
  "/for/freelancers",
  "/for/content-creators",
  "/for/small-businesses",
  "/for/coaches",
  "/compare/linktree",
  "/compare/liinks",
  "/terms",
  "/privacy",
  "/cookies",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicSiteUrl();
  if (base.includes("localhost") && process.env.NODE_ENV === "production") {
    console.warn("sitemap: refusing localhost origin in production");
  }
  const now = new Date();
  const locales = await getIndexableSeoLocales();

  function languageAlternates(path: string): Record<string, string> {
    const map: Record<string, string> = {};
    for (const code of locales) {
      map[code] = absoluteLocaleUrl(code, path);
    }
    map["x-default"] = absoluteLocaleUrl(DEFAULT_SEO_LOCALE, path);
    return map;
  }

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      staticEntries.push({
        url: absoluteLocaleUrl(locale, path),
        lastModified: now,
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : path.startsWith("/for/") || path.startsWith("/compare/") ? 0.7 : 0.8,
        alternates: { languages: languageAlternates(path) },
      });
    }
  }

  const demoEntries: MetadataRoute.Sitemap = demos.map((demo) => ({
    url: absoluteUrl(`/${demo.page.handle}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  let published: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pages")
      .select("handle, updated_at, display_name, content")
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(5000);

    const demoHandles = new Set(demos.map((d) => d.page.handle));
    published = (data ?? [])
      .filter((row) => {
        if (!row.handle || demoHandles.has(row.handle)) return false;
        const content = (row.content ?? {}) as {
          bio?: string;
          blocks?: unknown[];
          socials?: unknown[];
        };
        const name = String(row.display_name ?? "").trim();
        const bio = String(content.bio ?? "").trim();
        const blocks = Array.isArray(content.blocks) ? content.blocks.length : 0;
        const socials = Array.isArray(content.socials) ? content.socials.length : 0;
        return Boolean(name && (bio || blocks > 0 || socials > 0));
      })
      .map((row) => ({
        url: absoluteUrl(`/${row.handle}`),
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    published = [];
  }

  return [...staticEntries, ...demoEntries, ...published];
}
