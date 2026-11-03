import type { CSSProperties } from "react";
import { imageFrame, placedImageStyle } from "@/app/lib/image-frame";
import type { PageContent } from "@/app/lib/types";

export type ContactAvatarSource = "profile" | "custom";

export function contactAvatarSourceOf(page: PageContent): ContactAvatarSource {
  return page.contactAvatarSource === "custom" ? "custom" : "profile";
}

export function resolveContactAvatarUrl(page: PageContent): string | null {
  if (contactAvatarSourceOf(page) === "custom") return page.contactAvatarUrl ?? null;
  return page.avatarUrl ?? null;
}

export function contactAvatarFrameStyle(page: PageContent): CSSProperties | undefined {
  if (!resolveContactAvatarUrl(page)) return undefined;
  if (contactAvatarSourceOf(page) === "profile") {
    const frame = imageFrame(page.avatarX, page.avatarY, page.avatarZoom);
    return placedImageStyle(frame.x, frame.y, frame.zoom);
  }
  const frame = imageFrame(page.contactAvatarX, page.contactAvatarY, page.contactAvatarZoom);
  return placedImageStyle(frame.x, frame.y, frame.zoom);
}

export function splitDisplayName(displayName: string): { first: string; last: string; full: string } {
  const full = displayName.trim();
  if (!full) return { first: "", last: "", full: "" };
  const parts = full.split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");
  return { first, last, full };
}
