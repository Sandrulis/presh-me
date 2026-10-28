import { isPublicProfilePathname } from "@/app/lib/handles";

/** Public /{handle} pages (demos + live) — stay live for visitors during maintenance. */
export function isMaintenancePublicStreamPath(pathname: string): boolean {
  return isPublicProfilePathname(pathname);
}

/** Paths that stay usable during maintenance (no blur overlay, no session kick). */
export function isMaintenanceOverlayExcludedPath(pathname: string): boolean {
  if (isMaintenancePublicStreamPath(pathname)) return true;
  if (pathname === "/login") return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/brand/")) return true;
  return false;
}
