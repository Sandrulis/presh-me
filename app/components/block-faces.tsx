"use client";

import dynamic from "next/dynamic";
import { PageMedia } from "@/app/components/page-media";
import { fontFamilyOf } from "@/app/lib/font-catalog";
import { instagramPostPageUrl, instagramProfileUrl, spotifyEmbedUrl, youtubeEmbedUrl } from "@/app/lib/blocks";
import type {
  AudioBlock,
  FaqBlock,
  ImageBlock,
  InstagramBlock,
  LinkBlock,
  PageBlock,
  QuoteBlock,
  ResumeBlock,
  TextBlock,
  YoutubeBlock,
} from "@/app/lib/types";
import type { Theme } from "@/app/lib/themes";
import { safeHref } from "@/app/lib/urls";

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
    case "youtube":
      return <YoutubeFace block={block} />;
    case "image":
      return <ImageFace block={block} />;
    case "audio":
      return <AudioFace block={block} />;
    case "resume":
      return <ResumeFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
    case "instagram":
      return <InstagramFace block={block} mode={mode} theme={theme} />;
    case "quote":
      return <QuoteFace block={block} theme={theme} pageFontFamily={pageFontFamily} />;
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
  const background = block.color || theme.button;
  const color = block.color ? contrastInk(block.color) : theme.buttonText;
  const radius = Math.max(0, block.borderRadius ?? 8);
  const inner = (
    <>
      <span className="font-semibold">{title}</span>
      {block.note.trim() ? <span className="mt-0.5 block text-xs opacity-70">{block.note}</span> : null}
    </>
  );
  const className = "block w-full px-4 py-3.5 text-center no-underline";
  const style = {
    background,
    color,
    borderRadius: radius,
    border: block.color ? "1px solid transparent" : `1px solid ${theme.buttonBorder ?? "transparent"}`,
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

function contrastInk(hex: string) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return "#ffffff";
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#111111" : "#ffffff";
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

function YoutubeFace({ block }: { block: YoutubeBlock }) {
  const embed = youtubeEmbedUrl(block.url);
  if (!embed) return null;
  const radius = Math.max(0, block.borderRadius ?? 12);
  const borderWidth = Math.max(0, block.borderWidth ?? 0);
  const borderColor = block.borderColor || "#111111";
  return (
    <div className="w-full">
      {block.title?.trim() ? (
        <p className="mb-2 px-1 text-left text-sm font-semibold" style={{ color: "inherit" }}>
          {block.title.trim()}
        </p>
      ) : null}
      <div
        className="relative aspect-video w-full overflow-hidden bg-black"
        style={{
          borderRadius: radius,
          border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
        }}
      >
        <iframe
          title={block.title?.trim() || "YouTube"}
          src={embed}
          className="absolute inset-0 h-full w-full border-0"
          style={{ borderRadius: Math.max(0, radius - borderWidth) }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

function InstagramFace({
  block,
  mode,
  theme,
}: {
  block: InstagramBlock;
  mode: "live" | "preview";
  theme: Theme;
}) {
  const handle = block.username.trim().replace(/^@/, "");
  const profileHref = handle ? instagramProfileUrl(handle) : null;
  const count = Math.min(12, Math.max(1, block.count || 6));
  const cols = block.columns === 2 || block.columns === 4 ? block.columns : 3;
  const pool = block.images.filter(Boolean).slice(0, count);
  if (pool.length === 0) return null;

  return (
    <div className="w-full">
      {handle ? (
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <span className="text-sm font-semibold" style={{ color: theme.text }}>
            @{handle}
          </span>
          {mode === "live" && profileHref ? (
            <a href={profileHref} className="text-xs no-underline" style={{ color: theme.muted }} target="_blank" rel="noreferrer">
              Instagram
            </a>
          ) : (
            <span className="text-xs" style={{ color: theme.muted }}>
              Instagram
            </span>
          )}
        </div>
      ) : null}
      <ul className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {pool.map((src, index) => {
          const postHref = instagramPostPageUrl(src);
          const img = (
            <PageMedia src={src} className="h-full w-full object-cover" sizes="120px" />
          );
          return (
            <li key={`${block.id}-${index}`} className="aspect-square overflow-hidden rounded-lg" style={{ background: theme.button }}>
              {postHref && mode === "live" ? (
                <a href={postHref} className="block h-full w-full" target="_blank" rel="noreferrer">
                  {img}
                </a>
              ) : (
                img
              )}
            </li>
          );
        })}
      </ul>
    </div>
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

function FaqFace({ block, theme }: { block: FaqBlock; theme: Theme }) {
  const items = block.items.filter((item) => item.question.trim());
  if (items.length === 0) return null;
  const radius = Math.max(0, block.borderRadius ?? 8);
  const cardBg = block.backgroundColor || theme.button;
  const cardInk = block.backgroundColor ? contrastInk(cardBg) : theme.buttonText;
  const questionBg = block.questionBackground;
  const answerBg = block.answerBackground;
  const questionInk = questionBg ? contrastInk(questionBg) : cardInk;
  const answerInk = answerBg ? contrastInk(answerBg) : cardInk;
  return (
    <div className="flex w-full flex-col gap-2 text-left">
      {items.map((item) => (
        <details
          key={item.id}
          className="group overflow-hidden px-3 py-2.5"
          style={{ background: cardBg, color: cardInk, borderRadius: radius }}
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
