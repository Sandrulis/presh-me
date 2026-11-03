import { isHandleFormat, normalizeHandle } from "@/app/lib/handles";

/** Matches UUID block ids with headroom. */
export const BOOKING_BLOCK_ID_MAX = 64;
const BOOKING_BLOCK_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export function isValidBookingBlockId(raw: string): boolean {
  const id = raw.trim();
  if (!id || id.length > BOOKING_BLOCK_ID_MAX) return false;
  return BOOKING_BLOCK_ID_RE.test(id);
}

export function isValidBookingHandle(raw: string): boolean {
  return isHandleFormat(normalizeHandle(raw));
}
