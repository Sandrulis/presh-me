import { isValidBookingBlockId, isValidBookingHandle } from "@/app/lib/booking/booking-input-limits";
import { buildBookingIcsCalendar } from "@/app/lib/booking/build-booking-ics";
import { verifyBookingCalendarToken } from "@/app/lib/booking/calendar-token";
import { pageJsonHasBookingBlock } from "@/app/lib/booking/page-has-booking-block";
import { resolveBookingSettingsFromBlock } from "@/app/lib/booking/schedule";
import { normalizeHandle } from "@/app/lib/handles";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { rowToPortfolio, type PageRow } from "@/app/lib/supabase/map-page";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import type { BookingBlock } from "@/app/lib/types";

export async function loadBookingCalendarFeed(input: {
  handle: string;
  blockId: string;
  token: string;
}): Promise<{ ok: true; body: string; calendarName: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.booking_unavailable" };
  }

  const handle = normalizeHandle(input.handle);
  const blockId = input.blockId?.trim() ?? "";
  const token = input.token?.trim() ?? "";
  if (!isValidBookingHandle(handle) || !isValidBookingBlockId(blockId) || !token) {
    return { ok: false, error: "errors.booking_invalid" };
  }

  const admin = createAdminClient();
  const { data: pageRow, error: pageError } = await admin
    .from("pages")
    .select("id, account_id, display_name, handle, published, content, created_at, updated_at")
    .eq("handle", handle)
    .maybeSingle();
  if (pageError || !pageRow) {
    return { ok: false, error: "errors.booking_page_not_found" };
  }

  const pageId = String(pageRow.id);
  if (!verifyBookingCalendarToken(pageId, blockId, token)) {
    return { ok: false, error: "errors.booking_invalid" };
  }

  const page = rowToPortfolio(pageRow as PageRow);
  if (!pageJsonHasBookingBlock(page.blocks, blockId)) {
    return { ok: false, error: "errors.booking_invalid" };
  }

  const block = page.blocks.find(
    (item): item is BookingBlock => item.type === "booking" && item.id === blockId,
  );
  if (!block) {
    return { ok: false, error: "errors.booking_invalid" };
  }

  const settings = resolveBookingSettingsFromBlock(block);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  const fromIso = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}-${String(fromDate.getDate()).padStart(2, "0")}`;

  const { data, error } = await admin
    .from("page_booking_reservations")
    .select("id, booking_date, booking_time, guest_email, comment")
    .eq("page_id", pageId)
    .eq("block_id", blockId)
    .gte("booking_date", fromIso)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (error) {
    console.error("loadBookingCalendarFeed", error.message);
    return { ok: false, error: "errors.booking_unavailable" };
  }

  const pageName = page.displayName.trim() || handle;
  const calendarName = pageName;
  const body = buildBookingIcsCalendar({
    calendarName,
    events: (data ?? []).map((row) => ({
      uid: String(row.id),
      date: String(row.booking_date).slice(0, 10),
      time: String(row.booking_time),
      sessionMinutes: settings.sessionMinutes,
      guestEmail: String(row.guest_email ?? ""),
      comment: String(row.comment ?? ""),
    })),
  });

  return { ok: true, body, calendarName };
}
