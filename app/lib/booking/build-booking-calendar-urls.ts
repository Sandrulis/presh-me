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
  calendarName: string;
}): BookingCalendarUrls & { calendarName: string } {
  const token = signBookingCalendarToken(input.pageId, input.blockId);
  const params = new URLSearchParams({
    handle: input.handle,
    blockId: input.blockId,
    token,
  });
  const icsUrl = `${getCalendarFeedOrigin()}/api/booking/calendar?${params.toString()}`;
  const webcalUrl = icsUrl.replace(/^https?:/, "webcal:");
  // Google reads X-WR-CALNAME from the fetched ICS — cid must be webcal:// (not https://).
  const googleCid = encodeURIComponent(webcalUrl);
  const googleUrl = `https://www.google.com/calendar/render?cid=${googleCid}`;
  return {
    calendarName: input.calendarName.trim() || input.handle,
    icsUrl,
    webcalUrl,
    googleUrl,
    appleUrl: webcalUrl,
  };
}
