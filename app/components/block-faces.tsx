"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GalleryBlockFace } from "@/app/components/gallery-block-face";
import { XEmbed } from "@/app/components/x-embed";
import { PageMedia } from "@/app/components/page-media";
import { fontFamilyOf } from "@/app/lib/font-catalog";
import {
  formatItemPrice,
  spotifyEmbedUrl,
  videoEmbedUrl,
} from "@/app/lib/blocks";
import { instagramPostEmbedUrl } from "@/app/lib/social-embeds";
import { contrastInk, hasSolidColor, isTransparentColor, surfacePaint } from "@/app/lib/color/surface";
import { googleMapsEmbedUrl } from "@/app/lib/google-maps-embed";
import type {
  AudioBlock,
  FaqBlock,
  ProductsBlock,
  ServicesBlock,
  SkillsBlock,
  ImageBlock,
  InstagramBlock,
  LinkBlock,
  MapsBlock,
  PageBlock,
  QuoteBlock,
  ResumeBlock,
  TextBlock,
  VideoBlock,
} from "@/app/lib/types";
import type { Theme } from "@/app/lib/themes";
import { safeHref } from "@/app/lib/urls";

const PollBlockFace = dynamic(
  () => import("@/app/components/poll-block-face").then((mod) => mod.PollBlockFace),
  {
    loading: () => (
      <div className="block h-24 w-full animate-pulse rounded-lg bg-black/10" aria-hidden />
    ),
  },
);

const CountdownBlockFace = dynamic(
  () => import("@/app/components/countdown-block-face").then((mod) => mod.CountdownBlockFace),
  {
    loading: () => (
      <div className="block h-[120px] w-full animate-pulse rounded-lg bg-black/10" aria-hidden />
    ),
  },
);

const BookingBlockFace = dynamic(
  () => import("@/app/components/page-booking-ui").then((mod) => mod.BookingBlockFace),
  {
    loading: () => (
      <div
        className="block h-[46px] w-full animate-pulse rounded-lg bg-black/10"
        aria-hidden
      />
    ),
  },
);

export function BlockFace({
  block,
  mode,
  theme,
  pageFontFamily,
  pageHandle,
}: {
  block: PageBlock;
  mode: "live" | "preview";
  theme: Theme;
  pageFontFamily?: string;
  pageHandle?: string;
}) {
  switch (block.type) {
    case "link":
      return <LinkFace block={block} mode={mode} theme={theme} />;
    case "text":
      return <TextFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
    case "video":
      return <VideoFace block={block} />;
    case "image":
      return <ImageFace block={block} />;
    case "audio":
      return <AudioFace block={block} />;
    case "maps":
      return <MapsFace block={block} />;
    case "resume":
      return <ResumeFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
    case "instagram":
      return <InstagramFace block={block} />;
    case "x":
      return <XEmbed source={block.source} />;
    case "quote":
      return <QuoteFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
    case "skills":
      return <SkillsFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
    case "services":
      return <ServicesFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
    case "products":
      return <ProductsFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
    case "gallery":
      return <GalleryBlockFace block={block} theme={theme} />;
    case "countdown":
      return <CountdownBlockFace block={block} theme={theme} />;
    case "poll":
      return (
        <PollBlockFace block={block} mode={mode} theme={theme} pageHandle={pageHandle ?? ""} />
      );
    case "faq":
      return <FaqFace block={block} theme={theme} />;
    case "booking":
      return (
        <BookingBlockFace block={block} mode={mode} theme={theme} pageHandle={pageHandle ?? ""} />
      );
  }
}

function LinkFace({
  block,
  mode,
  theme,
}: {
  block: LinkBlock;
  mode: "live" | "preview";
  theme: Theme;
}) {
  const href = safeHref(block.url);
  const title = block.title.trim() || "Jauna saite";
  const paint = surfacePaint(block.color, theme.button, theme.buttonText, theme.text);
  const radius = Math.max(0, block.borderRadius ?? 8);
  const inner = (
    <>
      <span className="font-semibold">{title}</span>
      {block.note.trim() ? <span className="mt-0.5 block text-xs opacity-70">{block.note}</span> : null}
    </>
  );
  const className = "block w-full px-4 py-3.5 text-center no-underline";
  const style = {
    background: paint.background,
    color: paint.color,
    borderRadius: radius,
    border: paint.solid ? "1px solid transparent" : `1px solid ${theme.buttonBorder ?? "transparent"}`,
  };
  if (href && mode === "live") {
    return (
      <a href={href} className={className} style={style} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <div className={className} style={style}>
      {inner}
    </div>
  );
}

function TextFace({
  block,
  theme,
  pageFontFamily,
}: {
  block: TextBlock;
  theme: Theme;
  pageFontFamily?: string;
}) {
  if (!block.body.trim()) return null;
  return (
    <p
      className="w-full px-2 leading-relaxed whitespace-pre-wrap"
      style={{
        color: block.color || theme.muted,
        fontFamily: fontFamilyOf(block.fontId) || pageFontFamily,
        fontSize: block.fontSize ?? 14,
        textAlign: block.align ?? "center",
      }}
    >
      {block.body}
    </p>
  );
}

function VideoFace({ block }: { block: VideoBlock }) {
  const embed = videoEmbedUrl(block.url);
  if (!embed) return null;
  const radius = Math.max(0, block.borderRadius ?? 12);
  const borderWidth = Math.max(0, block.borderWidth ?? 0);
  const borderColor = block.borderColor || "#111111";
  const frameClass =
    embed.provider === "tiktok"
      ? "relative aspect-[9/16] w-full max-w-[min(100%,340px)] overflow-hidden bg-black mx-auto"
      : "relative aspect-video w-full overflow-hidden bg-black";
  const allow =
    embed.provider === "vimeo"
      ? "autoplay; fullscreen; picture-in-picture"
      : embed.provider === "tiktok"
        ? "encrypted-media; fullscreen"
        : "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  return (
    <div className="w-full">
      {block.title?.trim() ? (
        <p className="mb-2 px-1 text-left text-sm font-semibold" style={{ color: "inherit" }}>
          {block.title.trim()}
        </p>
      ) : null}
      <div
        className={frameClass}
        style={{
          borderRadius: radius,
          border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
        }}
      >
        <iframe
          title={block.title?.trim() || "Video"}
          src={embed.src}
          className="absolute inset-0 h-full w-full border-0"
          style={{ borderRadius: Math.max(0, radius - borderWidth) }}
          allow={allow}
          allowFullScreen
        />
      </div>
    </div>
  );
}

function ImageFace({ block }: { block: ImageBlock }) {
  if (!block.src) return null;
  const radius = Math.max(0, block.borderRadius ?? 12);
  const borderWidth = Math.max(0, block.borderWidth ?? 0);
  const borderColor = block.borderColor || "#111111";
  return (
    <figure className="w-full">
      <div
        className="overflow-hidden"
        style={{
          borderRadius: radius,
          border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
        }}
      >
        <PageMedia
          src={block.src}
          alt={block.alt.trim() || ""}
          className="h-auto w-full object-cover"
          style={{ borderRadius: Math.max(0, radius - borderWidth) }}
          sizes="(max-width: 640px) 100vw, 420px"
        />
      </div>
      {block.alt.trim() ? (
        <figcaption className="mt-1.5 px-1 text-center text-xs opacity-70">{block.alt.trim()}</figcaption>
      ) : null}
    </figure>
  );
}

function MapsFace({ block }: { block: MapsBlock }) {
  const initialEmbed = block.embedSrc?.trim() || googleMapsEmbedUrl(block.url);
  const [embed, setEmbed] = useState<string | null>(initialEmbed);
  const [loading, setLoading] = useState(!initialEmbed && Boolean(block.url.trim()));

  useEffect(() => {
    const cached = block.embedSrc?.trim() || googleMapsEmbedUrl(block.url);
    if (cached) {
      setEmbed(cached);
      setLoading(false);
      return;
    }
    const raw = block.url.trim();
    if (!raw) {
      setEmbed(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/maps/embed?url=${encodeURIComponent(raw)}`)
      .then((response) => response.json())
      .then((data: { success?: boolean; embedUrl?: string }) => {
        if (cancelled) return;
        setEmbed(data.success && data.embedUrl ? data.embedUrl : null);
      })
      .catch(() => {
        if (!cancelled) setEmbed(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [block.url, block.embedSrc]);

  if (loading) {
    return (
      <div
        className="h-[280px] w-full animate-pulse rounded-xl bg-black/10"
        aria-busy="true"
        aria-label="Google Maps"
      />
    );
  }
  if (!embed) return null;
  const radius = Math.max(0, block.borderRadius ?? 12);
  const borderWidth = Math.max(0, block.borderWidth ?? 0);
  const borderColor = block.borderColor || "#111111";
  const height = Math.max(160, Math.min(560, block.height ?? 280));
  return (
    <div className="w-full">
      {block.title?.trim() ? (
        <p className="mb-2 px-1 text-left text-sm font-semibold" style={{ color: "inherit" }}>
          {block.title.trim()}
        </p>
      ) : null}
      <div
        className="relative w-full overflow-hidden bg-[#e8edf5]"
        style={{
          height,
          borderRadius: radius,
          border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
        }}
      >
        <iframe
          title={block.title?.trim() || "Google Maps"}
          src={embed}
          className="absolute inset-0 h-full w-full border-0"
          style={{ borderRadius: Math.max(0, radius - borderWidth) }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

function AudioFace({ block }: { block: AudioBlock }) {
  const embed = spotifyEmbedUrl(block.url);
  if (!embed) return null;
  const radius = Math.max(0, block.borderRadius ?? 12);
  const borderWidth = Math.max(0, block.borderWidth ?? 0);
  const borderColor = block.borderColor || "#111111";
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        borderRadius: radius,
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
      }}
    >
      <iframe
        title="Spotify"
        src={embed}
        className="h-[152px] w-full border-0"
        style={{ borderRadius: Math.max(0, radius - borderWidth) }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

function ResumeFace({
  block,
  theme,
  pageFontFamily,
}: {
  block: ResumeBlock;
  theme: Theme;
  pageFontFamily?: string;
}) {
  const items = block.items.filter((item) => item.date.trim() || item.title.trim());
  if (items.length === 0) return null;
  const lineColor = block.lineColor ?? theme.muted;
  const lineWidth = Math.max(1, block.lineWidth ?? 1);
  const circleColor = block.circleColor ?? theme.text;
  const circleSize = Math.max(16, Math.min(64, block.circleSize ?? 32));
  const railWidth = Math.max(40, circleSize + 8);
  const titleSize = block.fontSize ?? 14;
  const dateSize = Math.max(10, Math.round(titleSize * 0.72));
  const bodySize = Math.max(12, Math.round(titleSize * 0.95));
  const numberSize = Math.max(9, Math.round(circleSize * 0.32));
  const fontFamily = fontFamilyOf(block.fontId) || pageFontFamily;
  return (
    <div className="w-full text-left" style={{ fontFamily }}>
      {block.heading?.trim() ? (
        <h3 className="mb-4 text-center font-bold" style={{ color: theme.text, fontSize: titleSize + 2 }}>
          {block.heading.trim()}
        </h3>
      ) : null}
      <ol className="relative m-0 list-none p-0">
        {items.map((item, index) => (
          <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < items.length - 1 ? (
              <span
                className="pointer-events-none absolute bottom-0 -translate-x-1/2"
                style={{
                  left: railWidth / 2,
                  top: circleSize,
                  width: lineWidth,
                  background: lineColor,
                }}
                aria-hidden="true"
              />
            ) : null}
            <div className="relative z-[1] shrink-0" style={{ width: railWidth }}>
              <span
                className="grid place-items-center rounded-full font-bold text-white"
                style={{
                  width: circleSize,
                  height: circleSize,
                  marginInline: "auto",
                  background: circleColor,
                  fontSize: numberSize,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              {item.date.trim() ? (
                <p
                  className="font-semibold tracking-[0.08em] uppercase"
                  style={{ color: theme.muted, fontSize: dateSize }}
                >
                  {item.date.trim()}
                </p>
              ) : null}
              {item.title.trim() ? (
                <p className="mt-0.5 font-bold" style={{ color: theme.text, fontSize: titleSize }}>
                  {item.title.trim()}
                </p>
              ) : null}
              {item.description.trim() ? (
                <p
                  className="mt-1 leading-relaxed whitespace-pre-wrap"
                  style={{ color: theme.muted, fontSize: bodySize }}
                >
                  {item.description.trim()}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function InstagramFace({ block }: { block: InstagramBlock }) {
  const src = instagramPostEmbedUrl(block.postUrl ?? "");
  if (!src) return null;
  return (
    <iframe
      src={src}
      title="Instagram"
      className="w-full overflow-hidden rounded-xl"
      style={{ height: 540, border: 0 }}
      loading="lazy"
    />
  );
}

function QuoteFace({
  block,
  theme,
  pageFontFamily,
}: {
  block: QuoteBlock;
  theme: Theme;
  pageFontFamily?: string;
}) {
  if (!block.text.trim()) return null;
  return (
    <blockquote
      className="w-full px-3 py-2"
      style={{
        color: block.color || theme.text,
        fontFamily: fontFamilyOf(block.fontId) || pageFontFamily,
        fontSize: block.fontSize ?? 18,
        textAlign: block.align ?? "center",
      }}
    >
      <p className="leading-relaxed whitespace-pre-wrap italic">&ldquo;{block.text.trim()}&rdquo;</p>
      {block.author?.trim() ? (
        <footer className="mt-2 text-sm not-italic opacity-70">— {block.author.trim()}</footer>
      ) : null}
    </blockquote>
  );
}

function SkillsFace({
  block,
  theme,
  pageFontFamily,
}: {
  block: SkillsBlock;
  theme: Theme;
  pageFontFamily?: string;
}) {
  const items = block.items.filter((item) => item.name.trim());
  if (items.length === 0) return null;
  const radius = Math.max(0, block.borderRadius ?? 8);
  const starColor = block.starColor ?? "#f59e0b";
  const fontSize = block.fontSize ?? 14;
  const fontFamily = fontFamilyOf(block.fontId) || pageFontFamily;
  const paint = surfacePaint(block.color, theme.button, theme.buttonText, theme.text);
  const cardStyle = {
    borderRadius: radius,
    background: paint.background,
    color: paint.color,
    border: paint.solid ? "1px solid transparent" : `1px solid ${theme.buttonBorder ?? "transparent"}`,
  };
  const rowDivider = `${paint.color}22`;
  const starMuted = paint.solid ? `${paint.color}55` : theme.muted;
  return (
    <div className="w-full text-left" style={{ fontFamily }}>
      {block.heading?.trim() ? (
        <h3 className="mb-3 text-center font-bold" style={{ color: theme.text, fontSize: fontSize + 2 }}>
          {block.heading.trim()}
        </h3>
      ) : null}
      <ul className="m-0 list-none overflow-hidden p-0" style={cardStyle}>
        {items.map((item, index) => {
          const rating = Math.max(0, Math.min(5, Math.round(item.rating)));
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
              style={index < items.length - 1 ? { borderBottom: `1px solid ${rowDivider}` } : undefined}
            >
              <span className="min-w-0 truncate font-semibold" style={{ fontSize }}>
                {item.name.trim()}
              </span>
              <SkillStars rating={rating} color={starColor} emptyColor={starMuted} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ServicesFace({
  block,
  theme,
  pageFontFamily,
}: {
  block: ServicesBlock;
  theme: Theme;
  pageFontFamily?: string;
}) {
  const items = block.items.filter((item) => item.name.trim());
  if (items.length === 0) return null;
  const radius = Math.max(0, block.borderRadius ?? 8);
  const fontSize = block.fontSize ?? 14;
  const fontFamily = fontFamilyOf(block.fontId) || pageFontFamily;
  const paint = surfacePaint(block.color, theme.button, theme.buttonText, theme.text);
  const cardStyle = {
    borderRadius: radius,
    background: paint.background,
    color: paint.color,
    border: paint.solid ? "1px solid transparent" : `1px solid ${theme.buttonBorder ?? "transparent"}`,
  };
  const rowDivider = `${paint.color}22`;
  return (
    <div className="w-full text-left" style={{ fontFamily }}>
      {block.heading?.trim() ? (
        <h3 className="mb-3 text-center font-bold" style={{ color: theme.text, fontSize: fontSize + 2 }}>
          {block.heading.trim()}
        </h3>
      ) : null}
      <ul className="m-0 list-none overflow-hidden p-0" style={cardStyle}>
        {items.map((item, index) => {
          const description = item.description?.trim() ?? "";
          const price = formatItemPrice(item.price, item.currency);
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 px-3 py-2.5"
              style={index < items.length - 1 ? { borderBottom: `1px solid ${rowDivider}` } : undefined}
            >
              <span className="min-w-0">
                <span className="block font-semibold" style={{ fontSize }}>
                  {item.name.trim()}
                </span>
                {description ? (
                  <span className="mt-0.5 block text-xs leading-relaxed opacity-70">{description}</span>
                ) : null}
              </span>
              {price ? (
                <span className="shrink-0 font-semibold tabular-nums" style={{ fontSize }}>
                  {price}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProductsFace({
  block,
  theme,
  pageFontFamily,
}: {
  block: ProductsBlock;
  theme: Theme;
  pageFontFamily?: string;
}) {
  const items = block.items.filter((item) => item.name.trim());
  if (items.length === 0) return null;
  const radius = Math.max(0, block.borderRadius ?? 8);
  const fontSize = block.fontSize ?? 14;
  const fontFamily = fontFamilyOf(block.fontId) || pageFontFamily;
  const paint = surfacePaint(block.color, theme.button, theme.buttonText, theme.text);
  const cardStyle = {
    borderRadius: radius,
    background: paint.background,
    color: paint.color,
    border: paint.solid ? "1px solid transparent" : `1px solid ${theme.buttonBorder ?? "transparent"}`,
  };
  const rowDivider = `${paint.color}22`;
  return (
    <div className="w-full text-left" style={{ fontFamily }}>
      {block.heading?.trim() ? (
        <h3 className="mb-3 text-center font-bold" style={{ color: theme.text, fontSize: fontSize + 2 }}>
          {block.heading.trim()}
        </h3>
      ) : null}
      <ul className="m-0 list-none overflow-hidden p-0" style={cardStyle}>
        {items.map((item, index) => {
          const description = item.description?.trim() ?? "";
          const price = formatItemPrice(item.price, item.currency);
          const image = item.imageUrl?.trim() ?? "";
          return (
            <li
              key={item.id}
              className="flex items-start gap-3 px-3 py-2.5"
              style={index < items.length - 1 ? { borderBottom: `1px solid ${rowDivider}` } : undefined}
            >
              {image ? (
                <PageMedia
                  src={image}
                  alt={item.name.trim()}
                  className="size-14 shrink-0 rounded-lg object-cover"
                  sizes="56px"
                />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold" style={{ fontSize }}>
                  {item.name.trim()}
                </span>
                {description ? (
                  <span className="mt-0.5 block text-xs leading-relaxed opacity-70">{description}</span>
                ) : null}
              </span>
              {price ? (
                <span className="shrink-0 font-semibold tabular-nums" style={{ fontSize }}>
                  {price}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SkillStars({
  rating,
  color,
  emptyColor,
}: {
  rating: number;
  color: string;
  emptyColor: string;
}) {
  return (
    <span className="inline-flex shrink-0 gap-0.5" aria-label={`${rating} no 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className="size-4"
          aria-hidden="true"
          fill={star <= rating ? color : "none"}
          stroke={star <= rating ? color : emptyColor}
          strokeWidth="1.8"
        >
          <path d="M12 3.2l2.4 5.6 6.1.6-4.6 4 1.4 6-5.3-3.2L6.7 19.4l1.4-6-4.6-4 6.1-.6L12 3.2z" />
        </svg>
      ))}
    </span>
  );
}

function FaqFace({ block, theme }: { block: FaqBlock; theme: Theme }) {
  const items = block.items.filter((item) => item.question.trim());
  if (items.length === 0) return null;
  const radius = Math.max(0, block.borderRadius ?? 8);
  const card = surfacePaint(block.backgroundColor, theme.button, theme.buttonText, theme.text);
  const questionBg = isTransparentColor(block.questionBackground)
    ? "transparent"
    : block.questionBackground?.trim() || undefined;
  const answerBg = isTransparentColor(block.answerBackground)
    ? "transparent"
    : block.answerBackground?.trim() || undefined;
  const questionInk = hasSolidColor(block.questionBackground)
    ? contrastInk(block.questionBackground ?? "")
    : card.color;
  const answerInk = hasSolidColor(block.answerBackground) ? contrastInk(block.answerBackground ?? "") : card.color;
  return (
    <div className="flex w-full flex-col gap-2 text-left">
      {items.map((item) => (
        <details
          key={item.id}
          className="group overflow-hidden px-3 py-2.5"
          style={{ background: card.background, color: card.color, borderRadius: radius }}
        >
          <summary
            className="flex cursor-pointer list-none items-start gap-2 font-semibold [&::-webkit-details-marker]:hidden"
            style={{
              background: questionBg || undefined,
              borderRadius: questionBg ? Math.max(0, radius - 4) : undefined,
              padding: questionBg ? "0.4rem 0.55rem" : undefined,
              color: questionInk,
              fontFamily: fontFamilyOf(block.questionFontId),
              fontSize: block.questionFontSize ?? 15,
            }}
          >
            <span className="min-w-0 flex-1">{item.question.trim()}</span>
            <span
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md opacity-70 transition-transform duration-200 group-open:rotate-45"
              aria-hidden="true"
            >
              <FaqToggleIcon />
            </span>
          </summary>
          {item.answer.trim() ? (
            <p
              className="mt-2 leading-relaxed whitespace-pre-wrap"
              style={{
                background: answerBg || undefined,
                borderRadius: answerBg ? Math.max(0, radius - 4) : undefined,
                padding: answerBg ? "0.45rem 0.55rem" : undefined,
                color: answerInk,
                fontFamily: fontFamilyOf(block.answerFontId),
                fontSize: block.answerFontSize ?? 14,
                opacity: answerBg ? 1 : 0.85,
              }}
            >
              {item.answer.trim()}
            </p>
          ) : null}
        </details>
      ))}
    </div>
  );
}

function FaqToggleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
