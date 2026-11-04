import { NextResponse } from "next/server";
import { isValidBookingBlockId, isValidBookingHandle } from "@/app/lib/booking/booking-input-limits";
import { loadBookingCalendarFeed } from "@/app/lib/booking/load-booking-calendar-feed";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(clientKeyFromRequest(request, "booking-calendar"), 40, 60_000);
  if (!limited.ok) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

  const url = new URL(request.url);
  const handle = url.searchParams.get("handle") ?? "";
  const blockId = url.searchParams.get("blockId") ?? "";
  const token = url.searchParams.get("token") ?? "";

  if (!isValidBookingHandle(handle) || !isValidBookingBlockId(blockId) || !token.trim()) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  const result = await loadBookingCalendarFeed({ handle, blockId, token });
  if (!result.ok) {
    const status = result.error === "errors.booking_page_not_found" ? 404 : 403;
    return new NextResponse("Not available", { status });
  }

  const safeFilename = result.calendarName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "presh-booking";

  return new NextResponse(result.body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${safeFilename}.ics"`,
      "Cache-Control": "private, max-age=300",
      "X-Presh-Calendar-Name": result.calendarName,
    },
  });
}
