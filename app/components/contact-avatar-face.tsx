"use client";

import type { CSSProperties } from "react";
import { PageMedia } from "@/app/components/page-media";
import { initials } from "@/app/lib/handles";
import { contactAvatarFrameStyle, resolveContactAvatarUrl } from "@/app/lib/contact/contact-avatar";
import type { PageContent } from "@/app/lib/types";

export function ContactAvatarFace({
  page,
  name,
  sizeClassName = "h-28 w-28 text-2xl",
}: {
  page: PageContent;
  name: string;
  sizeClassName?: string;
}) {
  const url = resolveContactAvatarUrl(page);
  const imageStyle = contactAvatarFrameStyle(page);

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#eef1f6] font-semibold text-[var(--ink)] ${sizeClassName}`}
    >
      {url ? (
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <PageMedia
            src={url}
            alt={name.trim() ? name : ""}
            className="absolute inset-0"
            style={imageStyle}
            sizes="112px"
          />
        </span>
      ) : (
        initials(name)
      )}
    </div>
  );
}
