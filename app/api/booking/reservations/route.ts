import { NextResponse } from "next/server";
import { isValidBookingBlockId, isValidBookingHandle } from "@/app/lib/booking/booking-input-limits";
import { loadPublicBookingReservations } from "@/app/lib/booking/load-booking-reservations";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(clientKeyFromRequest(request, "booking-reservations"), 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "errors.rate_limit" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const url = new URL(request.url);
  const handle = url.searchParams.get("handle") ?? "";
  const blockId = url.searchParams.get("blockId") ?? "";

  if (!isValidBookingHandle(handle) || !isValidBookingBlockId(blockId)) {
    return NextResponse.json({ ok: false, error: "errors.booking_invalid" }, { status: 400 });
  }

  const result = await loadPublicBookingReservations({ handle, blockId });
  if (!result.ok) {
    const status = result.error === "errors.booking_page_not_found" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, reservations: result.reservations });
}
