const BOOKING_TZ = "Europe/Riga";

export type BookingIcsEvent = {
  uid: string;
  date: string;
  time: string;
  sessionMinutes: number;
  guestEmail: string;
  comment: string;
};

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\:")
    .replace(/,/g, "\\,");
}

function foldLine(line: string): string {
  const max = 73;
  if (line.length <= max) return line;
  const parts: string[] = [line.slice(0, max)];
  let rest = line.slice(max);
  while (rest.length > max - 1) {
    parts.push(` ${rest.slice(0, max - 1)}`);
    rest = rest.slice(max - 1);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

function parseTimeParts(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function parseDateParts(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function addMinutesLocal(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  minutes: number,
) {
  const date = new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

function formatLocalStamp(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): string {
  const y = String(parts.year).padStart(4, "0");
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  const h = String(parts.hour).padStart(2, "0");
  const min = String(parts.minute).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}00`;
}

function formatUtcStamp(now = new Date()): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildBookingIcsCalendar(input: {
  calendarName: string;
  events: BookingIcsEvent[];
}): string {
  const calName = input.calendarName.trim() || "Presh.Me";
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Presh.Me//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`NAME:${icsEscape(calName)}`),
    foldLine(`X-WR-CALNAME:${icsEscape(calName)}`),
    foldLine(`X-APPLE-CALENDAR-NAME:${icsEscape(calName)}`),
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
    "BEGIN:VTIMEZONE",
    `TZID:${BOOKING_TZ}`,
    "BEGIN:STANDARD",
    "DTSTART:19701025T040000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "TZOFFSETFROM:+0300",
    "TZOFFSETTO:+0200",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "DTSTART:19700329T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0300",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
  ];

  for (const event of input.events) {
    const dateParts = parseDateParts(event.date);
    const timeParts = parseTimeParts(event.time);
    if (!dateParts || !timeParts) continue;

    const start = {
      year: dateParts.year,
      month: dateParts.month,
      day: dateParts.day,
      hour: timeParts.hour,
      minute: timeParts.minute,
    };
    const end = addMinutesLocal(start, Math.max(15, event.sessionMinutes));
    const summary = event.guestEmail.trim()
      ? `Booking: ${event.guestEmail.trim()}`
      : "Booking";
    const descriptionParts = [`Email: ${event.guestEmail.trim() || "—"}`];
    if (event.comment.trim()) {
      descriptionParts.push(`Comment: ${event.comment.trim()}`);
    }

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${icsEscape(event.uid)}@presh.me`));
    lines.push(`DTSTAMP:${formatUtcStamp()}`);
    lines.push(`DTSTART;TZID=${BOOKING_TZ}:${formatLocalStamp(start)}`);
    lines.push(`DTEND;TZID=${BOOKING_TZ}:${formatLocalStamp(end)}`);
    lines.push(foldLine(`SUMMARY:${icsEscape(summary)}`));
    lines.push(foldLine(`DESCRIPTION:${icsEscape(descriptionParts.join("\n"))}`));
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
