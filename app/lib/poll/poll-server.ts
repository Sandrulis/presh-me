import { normalizeHandle } from "@/app/lib/handles";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { rowToPortfolio, type PageRow } from "@/app/lib/supabase/map-page";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { shouldRedirectPublicProfileAway } from "@/app/lib/trial/public-trial-access";
import type { PollBlock } from "@/app/lib/types";

const VOTER_KEY = /^[\w-]{8,128}$/;
const BLOCK_ID = /^[\w-]{8,128}$/;
const OPTION_ID = /^[\w-]{8,128}$/;

export function isValidPollVoterKey(value: string): boolean {
  return VOTER_KEY.test(value.trim());
}

export function isValidPollBlockId(value: string): boolean {
  return BLOCK_ID.test(value.trim());
}

export function isValidPollOptionId(value: string): boolean {
  return OPTION_ID.test(value.trim());
}

async function loadPublishedPollBlock(handle: string, blockId: string): Promise<{ pageId: string; block: PollBlock } | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const normalizedHandle = normalizeHandle(handle);
  if (!normalizedHandle) return null;

  const admin = createAdminClient();
  const { data: pageRow, error } = await admin
    .from("pages")
    .select("id, account_id, handle, display_name, published, content, created_at, updated_at")
    .eq("handle", normalizedHandle)
    .maybeSingle();
  if (error || !pageRow) return null;

  const page = rowToPortfolio(pageRow as PageRow);
  if (!page.published || (await shouldRedirectPublicProfileAway(page))) return null;

  const block = page.blocks.find((item): item is PollBlock => item.type === "poll" && item.id === blockId);
  if (!block) return null;

  return { pageId: page.id, block };
}

export async function loadPollResults(
  handle: string,
  blockId: string,
  voterKey?: string,
): Promise<
  | {
      ok: true;
      counts: Record<string, number>;
      total: number;
      votedOptionId: string | null;
    }
  | { ok: false; error: string }
> {
  const loaded = await loadPublishedPollBlock(handle, blockId);
  if (!loaded) return { ok: false, error: "errors.poll_not_found" };

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("page_poll_votes")
    .select("option_id")
    .eq("page_id", loaded.pageId)
    .eq("block_id", blockId);
  if (error) return { ok: false, error: "errors.poll_unavailable" };

  const counts: Record<string, number> = {};
  for (const option of loaded.block.options) {
    counts[option.id] = 0;
  }
  for (const row of rows ?? []) {
    const id = row.option_id;
    if (typeof id === "string" && id in counts) {
      counts[id] += 1;
    }
  }
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  let votedOptionId: string | null = null;
  if (voterKey && isValidPollVoterKey(voterKey)) {
    const { data: mine } = await admin
      .from("page_poll_votes")
      .select("option_id")
      .eq("page_id", loaded.pageId)
      .eq("block_id", blockId)
      .eq("voter_key", voterKey.trim())
      .maybeSingle();
    if (mine?.option_id && typeof mine.option_id === "string") {
      votedOptionId = mine.option_id;
    }
  }

  return { ok: true, counts, total, votedOptionId };
}

export async function submitPollVote(input: {
  handle: string;
  blockId: string;
  optionId: string;
  voterKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const blockId = input.blockId.trim();
  const optionId = input.optionId.trim();
  const voterKey = input.voterKey.trim();

  if (!isValidPollBlockId(blockId) || !isValidPollOptionId(optionId) || !isValidPollVoterKey(voterKey)) {
    return { ok: false, error: "errors.poll_invalid" };
  }

  const loaded = await loadPublishedPollBlock(input.handle, blockId);
  if (!loaded) return { ok: false, error: "errors.poll_not_found" };

  const option = loaded.block.options.find((item) => item.id === optionId && item.label.trim());
  if (!option) return { ok: false, error: "errors.poll_invalid" };

  const admin = createAdminClient();
  const { error } = await admin.from("page_poll_votes").insert({
    page_id: loaded.pageId,
    block_id: blockId,
    option_id: optionId,
    voter_key: voterKey,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "errors.poll_already_voted" };
    }
    return { ok: false, error: "errors.poll_unavailable" };
  }

  return { ok: true };
}
