import { signBookingCalendarToken } from "@/app/lib/booking/calendar-token";
import { getCalendarFeedOrigin } from "@/app/lib/site-url";

export type BookingCalendarUrls = {
  icsUrl: string;
  webcalUrl: string;
  googleUrl: string;
  appleUrl: string;
};

export function buildBookingCalendarUrls(input: {
  pageId: string;
  handle: string;
  blockId: string;
}): BookingCalendarUrls {
  const token = signBookingCalendarToken(input.pageId, input.blockId);
  const params = new URLSearchParams({
    handle: input.handle,
    blockId: input.blockId,
    token,
  });
  const icsUrl = `${getCalendarFeedOrigin()}/api/booking/calendar?${params.toString()}`;
  const webcalUrl = icsUrl.replace(/^https?:/, "webcal:");
  // Google add-by-URL expects webcal:// in cid, not https:// (otherwise feed stays empty).
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
  return {
    icsUrl,
    webcalUrl,
    googleUrl,
    appleUrl: webcalUrl,
  };
}
