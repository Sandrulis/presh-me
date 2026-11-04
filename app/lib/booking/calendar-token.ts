import { createHmac, timingSafeEqual } from "crypto";

function calendarHmacSecret(): string {
  const dedicated = process.env.BOOKING_CALENDAR_SECRET?.trim();
  if (dedicated) return dedicated;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (service) return service;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BOOKING_CALENDAR_SECRET or SUPABASE_SERVICE_ROLE_KEY required");
  }
  return "dev-booking-calendar-secret";
}

export function signBookingCalendarToken(pageId: string, blockId: string): string {
  return createHmac("sha256", calendarHmacSecret())
    .update(`${pageId}:${blockId}`)
    .digest("base64url");
}

export function verifyBookingCalendarToken(pageId: string, blockId: string, token: string): boolean {
  const expected = signBookingCalendarToken(pageId, blockId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
