export function bookingSlotKey(date: string, time: string): string {
  return `${date}|${time}`;
}

export function parseBookingSlotKey(key: string): { date: string; time: string } | null {
  const index = key.indexOf("|");
  if (index <= 0) return null;
  const date = key.slice(0, index);
  const time = key.slice(index + 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return { date, time };
}
