import { cache } from "react";
import { getExample } from "@/app/lib/examples";
import { normalizeHandle } from "@/app/lib/handles";
import { getPublicSiteUrl } from "@/app/lib/site-url";
import { createClient } from "@/app/lib/supabase/server";
import { rowToPortfolio, type PageRow } from "@/app/lib/supabase/map-page";
import type { Portfolio } from "@/app/lib/types";

export const loadPageByHandle = cache(async function loadPageByHandle(
  rawHandle: string,
): Promise<Portfolio | null> {
  const handle = normalizeHandle(rawHandle);
  if (!handle) return null;
  const example = getExample(handle);
  if (example) return example;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("id, account_id, handle, display_name, published, content, created_at, updated_at")
    .eq("handle", handle)
    .maybeSingle();
  if (error || !data) return null;
  return rowToPortfolio(data as PageRow);
});

export function profileCanonicalUrl(handle: string): string {
  return `${getPublicSiteUrl()}/${normalizeHandle(handle)}`;
}

/** Enough public content to justify indexing (not empty shells). */
export function profileIsIndexable(page: Portfolio): boolean {
  if (!page.published) return false;
  if (page.accountId === "example") return true;
  const name = page.displayName.trim();
  const bio = page.bio.trim();
  const hasBlocks = page.blocks.length > 0;
  const hasSocials = page.socials.length > 0;
  // Conservative: require a display name plus at least one substance signal
  return Boolean(name && (bio || hasBlocks || hasSocials));
}
