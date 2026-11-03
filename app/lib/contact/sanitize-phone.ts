/** Contact phone field: leading "+" optional, then digits only. */
export function sanitizeContactPhoneInput(raw: string): string {
  const stripped = raw.replace(/[^\d+]/g, "");
  if (!stripped) return "";
  const digits = stripped.replace(/\+/g, "");
  const hadLeadingPlus = stripped.startsWith("+");
  if (!digits) return hadLeadingPlus ? "+" : "";
  return hadLeadingPlus ? `+${digits}` : digits;
}
