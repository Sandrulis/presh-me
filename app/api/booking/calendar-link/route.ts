import { NextResponse } from "next/server";
import { isValidBookingBlockId } from "@/app/lib/booking/booking-input-limits";
import { buildBookingCalendarUrls } from "@/app/lib/booking/build-booking-calendar-urls";
import { pageJsonHasBookingBlock } from "@/app/lib/booking/page-has-booking-block";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "errors.booking_unavailable" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "errors.unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId")?.trim() ?? "";
  const blockId = url.searchParams.get("blockId")?.trim() ?? "";
  if (!pageId || !isValidBookingBlockId(blockId)) {
    return NextResponse.json({ ok: false, error: "errors.booking_invalid" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("pages")
    .select("id, handle, account_id, display_name, content, blocks:content->blocks")
    .eq("id", pageId)
    .maybeSingle();
  if (error || !row || row.account_id !== user.id) {
    return NextResponse.json({ ok: false, error: "errors.booking_page_not_found" }, { status: 404 });
  }

  if (!pageJsonHasBookingBlock(row.blocks, blockId)) {
    return NextResponse.json({ ok: false, error: "errors.booking_invalid" }, { status: 400 });
  }

  const handle = String(row.handle ?? "").trim();
  if (!handle) {
    return NextResponse.json({ ok: false, error: "errors.booking_invalid" }, { status: 400 });
  }

  const content = row.content as { displayName?: string } | null;
  const calendarName =
    String(row.display_name ?? "").trim() ||
    String(content?.displayName ?? "").trim() ||
    handle;

  const urls = buildBookingCalendarUrls({ pageId, handle, blockId, calendarName });
  return NextResponse.json({ ok: true, ...urls });
}
