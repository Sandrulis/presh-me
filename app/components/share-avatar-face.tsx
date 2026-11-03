"use client";

import type { CSSProperties } from "react";
import { PageMedia } from "@/app/components/page-media";
import { initials } from "@/app/lib/handles";
import {
  resolveShareAvatarUrl,
  shareAvatarBorderColor,
  shareAvatarBorderRadius,
  shareAvatarBorderWidth,
  shareAvatarFrameStyle,
} from "@/app/lib/share/share-avatar";
import type { PageContent } from "@/app/lib/types";

export function ShareAvatarFace({
  page,
  name,
  sizeClassName = "h-28 w-28 text-2xl",
}: {
  page: PageContent;
  name: string;
  sizeClassName?: string;
}) {
  const url = resolveShareAvatarUrl(page);
  const borderWidth = shareAvatarBorderWidth(page);
  const borderColor = shareAvatarBorderColor(page);
  const radius = shareAvatarBorderRadius(page);
  const imageStyle = shareAvatarFrameStyle(page);

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-[#eef1f6] font-semibold text-[var(--ink)] ${sizeClassName}`}
      style={{
        borderRadius: `${radius}%`,
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
      }}
    >
      {url ? (
        <span className="absolute inset-0 overflow-hidden">
          <PageMedia
            src={url}
            alt={name.trim() ? name : ""}
            className="absolute max-w-none"
            style={imageStyle as CSSProperties}
            sizes="112px"
          />
        </span>
      ) : (
        initials(name)
      )}
    </div>
  );
}
