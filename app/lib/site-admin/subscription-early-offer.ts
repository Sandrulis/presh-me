"use client";

import { createClient } from "@/app/lib/supabase/client";

export type SubscriptionEarlyOffer = {
  enabled: boolean;
  userLimit: number;
  freeMonths: number;
  extendable: boolean;
  claimed: number;
  notes: Record<string, string>;
};

function clampUsers(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100000, Math.floor(value)));
}

function clampMonths(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(24, Math.floor(value)));
}

export async function loadSubscriptionEarlyOffer(): Promise<SubscriptionEarlyOffer> {
  const supabase = createClient();
  const [offerRes, notesRes, claimsRes] = await Promise.all([
    supabase
      .from("subscription_early_offer")
      .select("is_enabled, user_limit, free_months, extendable")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("subscription_early_offer_i18n").select("language_code, note"),
    supabase.from("subscription_early_claims").select("user_id"),
  ]);
  if (offerRes.error) throw offerRes.error;
  if (notesRes.error) throw notesRes.error;
  if (claimsRes.error) throw claimsRes.error;

  const notes: Record<string, string> = {};
  for (const row of notesRes.data ?? []) {
    notes[row.language_code as string] = (row.note as string) ?? "";
  }

  return {
    enabled: offerRes.data?.is_enabled === true,
    userLimit: Number(offerRes.data?.user_limit) || 0,
    freeMonths: Number(offerRes.data?.free_months) || 0,
    extendable: offerRes.data?.extendable === true,
    claimed: claimsRes.data?.length ?? 0,
    notes,
  };
}

export async function saveSubscriptionEarlyOffer(input: {
  enabled: boolean;
  userLimit: number;
  freeMonths: number;
  extendable: boolean;
  notes: Record<string, string>;
}) {
  const supabase = createClient();
  const userLimit = clampUsers(input.userLimit);
  const freeMonths = clampMonths(input.freeMonths);
  const enabled = input.enabled === true && userLimit > 0 && freeMonths > 0;
  const extendable = input.extendable === true && enabled;

  const { error } = await supabase
    .from("subscription_early_offer")
    .update({
      is_enabled: enabled,
      user_limit: userLimit,
      free_months: freeMonths,
      extendable,
    })
    .eq("id", 1);
  if (error) throw error;

  const { error: deleteError } = await supabase
    .from("subscription_early_offer_i18n")
    .delete()
    .neq("language_code", "");
  if (deleteError) throw deleteError;

  const rows = Object.entries(input.notes)
    .map(([language_code, note]) => ({
      language_code,
      note: note.trim().slice(0, 400),
    }))
    .filter((row) => row.note.length > 0);
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("subscription_early_offer_i18n").insert(rows);
    if (insertError) throw insertError;
  }

  return loadSubscriptionEarlyOffer();
}
