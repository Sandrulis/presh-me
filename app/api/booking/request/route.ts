import { NextResponse } from "next/server";
import { submitBookingRequest } from "@/app/lib/booking/submit-booking-request";
import { clientKeyFromRequest, rateLimit, requestRemoteIp } from "@/app/lib/security/rate-limit";
import { requireTurnstileToken } from "@/app/lib/security/turnstile";

export async function POST(request: Request) {
  const limited = rateLimit(clientKeyFromRequest(request, "booking-request"), 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "errors.rate_limit" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    handle?: string;
    blockId?: string;
    date?: string;
    time?: string;
    email?: string;
    comment?: string;
    visitorLanguage?: string;
    turnstileToken?: string;
  } | null;

  const turnstile = await requireTurnstileToken(body?.turnstileToken, requestRemoteIp(request));
  if (!turnstile.ok) {
    return NextResponse.json({ ok: false, error: turnstile.error }, { status: 400 });
  }

  const result = await submitBookingRequest({
    handle: body?.handle ?? "",
    blockId: body?.blockId ?? "",
    date: body?.date ?? "",
    time: body?.time ?? "",
    email: body?.email ?? "",
    comment: body?.comment,
    visitorLanguage: body?.visitorLanguage,
  });

  if (!result.ok) {
    const status =
      result.error === "errors.rate_limit"
        ? 429
        : result.error === "errors.booking_page_not_found"
          ? 404
          : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
