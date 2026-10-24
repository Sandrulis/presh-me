export const SESSION_HINT_COOKIE = "presh_session";
const MAX_AGE = 60 * 60 * 24 * 30;

/** Lightweight cookie so SSR can skip Auth round-trip for anonymous visitors. */
export function setSessionHintCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=1; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}

export function clearSessionHintCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readSessionHintFromCookieHeader(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((part) => part.trim() === `${SESSION_HINT_COOKIE}=1`);
}
