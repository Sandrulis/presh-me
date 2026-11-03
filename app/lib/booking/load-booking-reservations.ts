import { pageJsonHasBookingBlock } from "@/app/lib/booking/page-has-booking-block";
import { isValidBookingBlockId, isValidBookingHandle } from "@/app/lib/booking/booking-input-limits";
import { normalizeHandle } from "@/app/lib/handles";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { shouldRedirectPublicProfileAwayLite } from "@/app/lib/trial/public-trial-access";

export type BookingReservationSlot = {
  date: string;
  time: string;
};

type BookingPageListRow = {
  id: string;
  account_id: string;
  published: boolean;
  trialStartedAt: string | null;
  blocks: unknown;
};

export async function loadPublicBookingReservations(input: {
  handle: string;
  blockId: string;
}): Promise<
  | { ok: true; reservations: BookingReservationSlot[] }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.booking_unavailable" };
  }

  const handle = normalizeHandle(input.handle);
  const blockId = input.blockId?.trim() ?? "";
  if (!isValidBookingHandle(handle) || !isValidBookingBlockId(blockId)) {
    return { ok: false, error: "errors.booking_invalid" };
  }

  const admin = createAdminClient();
  const { data: pageRow, error: pageError } = await admin
    .from("pages")
    .select(
      "id, account_id, published, trialStartedAt:content->trialStartedAt, blocks:content->blocks",
    )
    .eq("handle", handle)
    .maybeSingle();
  if (pageError || !pageRow) {
    return { ok: false, error: "errors.booking_page_not_found" };
  }

  const row = pageRow as BookingPageListRow;
  const trialStartedAt =
    typeof row.trialStartedAt === "string" && row.trialStartedAt.trim()
      ? row.trialStartedAt.trim()
      : null;

  if (
    await shouldRedirectPublicProfileAwayLite({
      published: row.published === true,
      accountId: String(row.account_id ?? ""),
      trialStartedAt,
    })
  ) {
    return { ok: false, error: "errors.booking_page_not_found" };
  }

  if (!pageJsonHasBookingBlock(row.blocks, blockId)) {
    return { ok: false, error: "errors.booking_invalid" };
  }

  const today = new Date();
  const fromIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data, error } = await admin
    .from("page_booking_reservations")
    .select("booking_date, booking_time")
    .eq("page_id", row.id)
    .eq("block_id", blockId)
    .gte("booking_date", fromIso)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (error) {
    console.error("loadPublicBookingReservations", error.message);
    return { ok: false, error: "errors.booking_unavailable" };
  }

  const reservations = (data ?? []).map((item) => ({
    date: String(item.booking_date).slice(0, 10),
    time: String(item.booking_time),
  }));

  return { ok: true, reservations };
}
