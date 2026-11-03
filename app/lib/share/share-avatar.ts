import type { CSSProperties } from "react";
import { imageFrame, placedImageStyle } from "@/app/lib/image-frame";
import type { PageContent } from "@/app/lib/types";

export type ShareAvatarSource = "profile" | "custom";

export function shareAvatarSourceOf(page: PageContent): ShareAvatarSource {
  return page.shareAvatarSource === "custom" ? "custom" : "profile";
}

export function resolveShareAvatarUrl(page: PageContent): string | null {
  if (shareAvatarSourceOf(page) === "custom") return page.shareAvatarUrl ?? null;
  return page.avatarUrl ?? null;
}

export function shareAvatarFrameStyle(page: PageContent): CSSProperties | undefined {
  const url = resolveShareAvatarUrl(page);
  if (!url) return undefined;
  if (shareAvatarSourceOf(page) === "profile") {
    const frame = imageFrame(page.avatarX, page.avatarY, page.avatarZoom);
    return placedImageStyle(frame.x, frame.y, frame.zoom);
  }
  const frame = imageFrame(page.shareAvatarX, page.shareAvatarY, page.shareAvatarZoom);
  return placedImageStyle(frame.x, frame.y, frame.zoom);
}

export function shareAvatarBorderRadius(page: PageContent): number {
  return page.shareAvatarRadius ?? 50;
}

export function shareAvatarBorderWidth(page: PageContent): number {
  return page.shareAvatarBorder ?? 3;
}

export function shareAvatarBorderColor(page: PageContent): string {
  return page.shareAvatarBorderColor ?? "#ffffff";
}

export function publicPageUrl(handle: string, origin?: string): string {
  const trimmed = handle.trim();
  const base =
    origin?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "https://presh.me");
  return `${base}/${trimmed}`;
}
