import { parseIsoDate } from "@/app/lib/booking/schedule";

export function formatBookingDateLabel(iso: string, languageCode: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat(languageCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
