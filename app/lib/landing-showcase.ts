import { RESERVED_HANDLES } from "@/app/lib/handles";
import { profileIsIndexable } from "@/app/lib/seo/public-page";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { rowToPortfolio, type PageRow } from "@/app/lib/supabase/map-page";
import type { Portfolio } from "@/app/lib/types";

/** How many cards the landing strip shows. Fewer real pages are repeated to fill it. */
export const SHOWCASE_COUNT = 10;

const PAGE_COLUMNS =
  "id, account_id, handle, display_name, published, content, created_at, updated_at";

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap]!;
    next[swap] = current!;
  }
  return next;
}

/** Repeat pages until the strip has `count` cards. */
export function repeatShowcasePages(pages: Portfolio[], count = SHOWCASE_COUNT): Portfolio[] {
  if (pages.length === 0 || pages.length >= count) return pages.slice(0, count);
  const repeated: Portfolio[] = [];
  while (repeated.length < count) {
    for (const page of pages) {
      repeated.push(page);
      if (repeated.length >= count) break;
    }
  }
  return repeated;
}

/**
 * Published user pages for the landing strip.
 * Service role: the public select policy calls is_system_admin(), which anon cannot execute.
 * Only published rows are returned.
 */
export async function loadLandingShowcasePages(): Promise<Portfolio[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pages")
      .select(PAGE_COLUMNS)
      .eq("published", true)
      .limit(500);
    if (error || !data) return [];

    const eligible = (data as PageRow[])
      .map(rowToPortfolio)
      .filter(
        (page) =>
          page.published && profileIsIndexable(page) && !RESERVED_HANDLES.has(page.handle),
      );

    return repeatShowcasePages(shuffle(eligible));
  } catch {
    return [];
  }
}
