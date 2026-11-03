const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isGuestBookingEmail(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_PATTERN.test(trimmed);
}

export function normalizeGuestBookingEmail(value: string): string {
  return value.trim().toLowerCase();
}
