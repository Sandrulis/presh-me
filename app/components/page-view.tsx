import Link from "next/link";
import type { ReactNode } from "react";
import { BlockFace } from "@/app/components/block-faces";
import { PageContactUi } from "@/app/components/page-contact-ui";
import { PageShareUi } from "@/app/components/page-share-ui";
import { PageMedia } from "@/app/components/page-media";
import { SocialIcon } from "@/app/components/social-icon";
import { textLookStyle } from "@/app/lib/text-look";
import { fontFamilyOf } from "@/app/lib/font-catalog";
import { initials } from "@/app/lib/handles";
import { imageFrame, pageImageFrame, placedImageStyle } from "@/app/lib/image-frame";
import { socialDisplayName } from "@/app/lib/socials";
import { getTheme, type Theme } from "@/app/lib/themes";
import type { HeaderLayout, PageContent, SectionId, StackSection } from "@/app/lib/types";
import { resolveStackOrder } from "@/app/lib/types";
import { safeHref } from "@/app/lib/urls";

export function PageView({
  page,
  mode = "live",
  framed = false,
  stretch = false,
}: {
  page: PageContent;
  mode?: "live" | "preview";
  framed?: boolean;
  stretch?: boolean;
}) {
  const theme = getTheme(page.themeId);
  const name = page.displayName.trim() || "Tavs vārds";
  /** Preview cards on marketing must never emit <h1> — page already has one. */
  const nameHeading: "h1" | "p" = mode === "preview" ? "p" : "h1";
  const photo = theme.backgroundImage;
  const overlay = theme.overlay ?? "rgba(0,0,0,0.45)";
  const gradient = theme.background.startsWith("linear-gradient");
  const themeHex = /^#[0-9a-fA-F]{6}$/.test(theme.background) ? theme.background : "#f4f6f8";
  const pageColor = page.pageColor || (photo || gradient ? "#111" : themeHex);
  const pageFrame = pageImageFrame(page.pageImagePosition, page.pageImageX, page.pageImageY, page.pageImageZoom);
  const pageContain = page.pageImageFit === "contain" && page.pageImageZoom == null;
  const fontFamily = fontFamilyOf(page.fontId);
  const show = (id: SectionId) => !page.sections || page.sections.includes(id);
  const layout: HeaderLayout = page.headerLayout ?? "center";
  const coverLayout = layout !== "center";
  const banner = layout === "banner-center" || layout === "banner-text";
  const cover = coverStyle(page, theme, photo, overlay, gradient);
  const bandHeight = bannerSize(page.bannerHeight, framed);
  const fade = bannerFadeOf(page);

  return (
    <div
      className={
        `relative ${
          framed
            ? `${stretch ? "h-full" : "min-h-full"} px-5 ${coverLayout ? "pb-8 pt-0" : "pb-8 pt-10"}`
            : `min-h-screen px-5 ${coverLayout ? "pb-12 pt-0" : "pb-12 pt-14"}`
        }`
      }
      style={{
        backgroundColor: pageColor,
        backgroundImage: page.pageImageUrl
          ? "none"
          : page.pageColor
            ? "none"
            : photo
              ? `linear-gradient(${overlay}, ${overlay}), url("${photo}")`
              : gradient
                ? theme.background
                : "none",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        color: theme.text,
        fontFamily,
      }}
    >
      {page.pageImageUrl ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <PageMedia
            src={page.pageImageUrl}
            className="absolute max-w-none"
            style={placedImageStyle(pageFrame.x, pageFrame.y, pageFrame.zoom, pageContain)}
          />
        </div>
      ) : null}
      <PageContactUi page={page} framed={framed} />
      <PageShareUi page={page} framed={framed} />
      {banner ? (
        <div className="relative z-10 -mx-5 overflow-hidden" style={{ height: bandHeight }}>
          <CoverFill page={page} cover={cover} fade={fade} pageColor={pageColor} />
        </div>
      ) : null}
      {layout === "banner-left" ? (
        <div className="relative z-10">
          <ProfileHeader
            page={page}
            theme={theme}
            name={name}
            nameHeading={nameHeading}
            layout={layout}
            cover={cover}
            pageColor={pageColor}
            bandHeight={bandHeight}
            fade={fade}
            bleed
          />
        </div>
      ) : null}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center text-center">
        {layout === "banner-left" ? null : (
          <ProfileHeader
            page={page}
            theme={theme}
            name={name}
            nameHeading={nameHeading}
            layout={layout}
            cover={cover}
            pageColor={pageColor}
            bandHeight={bandHeight}
            fade={fade}
          />
        )}

        {(() => {
          const stack = resolveStackOrder(page);
          const stackNodes: Record<StackSection, ReactNode> = {
            socials: page.socials.length > 0 ? (
              <ul key="socials" className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {page.socials.map((social) => {
                  const href = safeHref(social.url, social.platform);
                  const iconBox = Math.min(72, Math.max(24, page.socialIconSize ?? 40));
                  const className = "grid place-items-center rounded-full border bg-transparent";
                  const style = { width: iconBox, height: iconBox, borderColor: theme.muted, color: theme.text };
                  const icon = <SocialIcon platform={social.platform} size={Math.round(iconBox * 0.42)} />;
                  return (
                    <li key={social.id}>
                      {href && mode === "live" ? (
                        <a
                          href={href}
                          className={className}
                          style={style}
                          target={href.startsWith("mailto:") ? undefined : "_blank"}
                          rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
                          aria-label={socialDisplayName(social)}
                        >
                          {icon}
                        </a>
                      ) : (
                        <span className={className} style={style}>
                          {icon}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null,
            blocks: (
              <div key="blocks" className="mt-6 flex w-full flex-col gap-3">
                {page.blocks.map((block) => (
                  <BlockFace
                    key={block.id}
                    block={block}
                    mode={mode}
                    theme={theme}
                    pageFontFamily={fontFamily}
                    pageHandle={page.handle}
                  />
                ))}
              </div>
            ),
          };
          return (
            <>
              {stackNodes[stack[0] ?? "socials"]}
              {show("instagram") && page.gallery && page.gallery.some((src) => src !== page.avatarUrl) ? (
                <ul className="mt-6 grid w-full grid-cols-3 gap-2">
                  {page.gallery.filter((src) => src !== page.avatarUrl).slice(0, 6).map((src) => (
                    <li key={src} className="aspect-square overflow-hidden rounded-xl">
                      <PageMedia src={src} className="h-full w-full object-cover" sizes="33vw" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {show("carousel") && page.carousel && page.carousel.length > 0 ? (
                <ul className="mt-6 flex w-full gap-2 overflow-x-auto pb-1">
                  {page.carousel.map((item) => (
                    <li
                      key={item.id}
                      className="w-40 shrink-0 rounded-2xl px-3 py-3 text-left"
                      style={{
                        background: theme.button,
                        color: theme.buttonText,
                        border: `1px solid ${theme.buttonBorder ?? "transparent"}`,
                      }}
                    >
                      <span className="block text-sm font-semibold">{item.title}</span>
                      {item.note ? <span className="mt-1 block text-xs opacity-70">{item.note}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {stackNodes[stack[1] ?? "blocks"]}
            </>
          );
        })()}

        {show("faq") && page.faqs && page.faqs.length > 0 ? (
          <div className="mt-4 flex w-full flex-col gap-2 text-left">
            {page.faqs.map((item) => (
              <details key={item.id} className="rounded-lg px-4 py-3" style={{ background: theme.button, color: theme.buttonText }}>
                <summary className="cursor-pointer font-semibold">{item.question}</summary>
                {item.answer ? <p className="mt-2 text-sm opacity-80">{item.answer}</p> : null}
              </details>
            ))}
          </div>
        ) : null}

        <p className="mt-10 text-xs tracking-wide" style={{ color: theme.muted }}>
          {mode === "live" ? (
            <Link href="/" className="no-underline">
              presh.me/{page.handle}
            </Link>
          ) : (
            <span>presh.me/{page.handle}</span>
          )}
        </p>
      </div>
    </div>
  );
}

function bannerSize(value: number | undefined, framed: boolean) {
  const percent = Math.min(85, Math.max(18, value ?? 40));
  return `${percent}${framed ? "cqh" : "dvh"}`;
}

function bannerFadeOf(page: PageContent) {
  if (typeof page.bannerFadeAmount === "number") return Math.min(100, Math.max(0, page.bannerFadeAmount));
  return page.bannerFade ? 40 : 0;
}

function CoverFill({
  page,
  cover,
  fade,
  pageColor,
}: {
  page: PageContent;
  cover: { backgroundColor: string; backgroundImage: string; backgroundSize: string; backgroundPosition: string };
  fade: number;
  pageColor: string;
}) {
  const banner = page.bannerUrl ? imageFrame(page.bannerX, page.bannerY, page.bannerZoom) : null;
  return (
    <>
      <div
        className="absolute inset-0 overflow-hidden bg-cover bg-center"
        style={{ ...cover, backgroundImage: page.bannerUrl ? "none" : cover.backgroundImage }}
      >
        {page.bannerUrl && banner ? (
          <PageMedia
            src={page.bannerUrl}
            className="absolute max-w-none"
            style={placedImageStyle(banner.x, banner.y, banner.zoom)}
          />
        ) : null}
      </div>
      {fade > 0 ? (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: `${fade}%`, background: `linear-gradient(to bottom, transparent, ${pageColor})` }}
        />
      ) : null}
    </>
  );
}

function coverStyle(
  page: PageContent,
  theme: Theme,
  photo: string | undefined,
  overlay: string,
  gradient: boolean,
) {
  const custom = page.bannerColor && /^#[0-9a-fA-F]{6}$/.test(page.bannerColor) ? page.bannerColor : null;
  return {
    backgroundColor: custom ?? (theme.button === theme.background ? theme.text : theme.button),
    backgroundImage: page.bannerUrl
      ? `url("${page.bannerUrl}")`
      : custom
        ? "none"
        : photo
          ? `linear-gradient(${overlay}, ${overlay}), url("${photo}")`
          : gradient
            ? theme.background
            : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function ProfileHeader({
  page,
  theme,
  name,
  nameHeading = "h1",
  layout,
  cover,
  pageColor,
  bandHeight,
  fade,
  bleed = false,
}: {
  page: PageContent;
  theme: Theme;
  name: string;
  nameHeading?: "h1" | "p";
  layout: HeaderLayout;
  cover: { backgroundColor: string; backgroundImage: string; backgroundSize: string; backgroundPosition: string };
  pageColor: string;
  bandHeight: string;
  fade: number;
  bleed?: boolean;
}) {
  const NameTag = nameHeading;
  const onCover = layout === "banner-left";
  const nameStyle = textLookStyle({
    color: page.nameColor,
    fallbackColor: onCover ? theme.buttonText : theme.text,
    fontId: page.nameFontId,
    fontSize: page.nameFontSize ?? (onCover ? 30 : 36),
    strokeWidth: page.nameStrokeWidth,
    strokeColor: page.nameStrokeColor,
  });
  const taglineStyle = textLookStyle({
    color: page.taglineColor,
    fallbackColor: onCover ? theme.buttonText : theme.muted,
    fontId: page.taglineFontId,
    fontSize: page.taglineFontSize ?? 13,
  });
  const bioStyle = textLookStyle({
    color: page.bioColor,
    fallbackColor: onCover ? theme.buttonText : theme.muted,
    fontId: page.bioFontId,
    fontSize: page.bioFontSize ?? 14,
  });
  const tagline = page.tagline?.trim() ? (
    <p className="mt-0.5 max-w-sm font-medium leading-snug tracking-[0.01em]" style={{ ...taglineStyle, opacity: page.taglineColor ? 0.88 : 0.62 }}>
      {page.tagline.trim()}
    </p>
  ) : null;
  const bio = page.bio.trim() ? (
    <p className="mt-1 max-w-sm text-sm leading-relaxed" style={{ ...bioStyle, opacity: page.bioColor ? 1 : 0.82 }}>
      {page.bio}
    </p>
  ) : null;
  const titleClass = "font-display text-4xl font-bold leading-tight tracking-[-0.03em]";

  if (layout === "banner-left") {
    const stacked = page.bannerContentPlace === "above";
    const align = page.bannerContentAlign ?? (stacked ? "center" : "left");
    const contentY = Math.min(100, Math.max(0, page.bannerContentY ?? 50));
    const contentClass = stacked
      ? align === "right"
        ? "flex-col items-end text-right"
        : align === "center"
          ? "flex-col items-center text-center"
          : "flex-col items-start text-left"
      : align === "right"
        ? "flex-row-reverse items-center justify-start gap-4 text-right"
        : align === "center"
          ? "items-center justify-center gap-4 text-left"
          : "items-center justify-start gap-4 text-left";
    return (
      <div className={`relative overflow-hidden ${bleed ? "-mx-5" : "w-full"}`} style={{ height: bandHeight }}>
        <CoverFill page={page} cover={cover} fade={fade} pageColor={pageColor} />
        <div className="relative h-full w-full">
          <div
            className={`absolute right-0 left-0 mx-auto flex w-full max-w-md px-5 ${contentClass}`}
            style={{ top: `${contentY}%`, transform: `translateY(-${contentY}%)` }}
          >
            <Avatar page={page} theme={theme} name={name} onBand className="h-20 w-20 shrink-0 text-base" />
            <div className={stacked ? "mt-3 min-w-0" : "min-w-0"}>
              <NameTag className="font-display text-3xl font-bold leading-tight tracking-[-0.03em]" style={nameStyle}>
                {name}
              </NameTag>
              {tagline}
              {bio}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {layout === "banner-text" ? null : (
        <Avatar
          page={page}
          theme={theme}
          name={name}
          onBand={layout === "banner-center"}
          className={layout === "banner-center" ? "-mt-12 h-24 w-24 text-lg" : "h-24 w-24 text-lg"}
        />
      )}
      <NameTag className={layout === "center" ? `mt-5 ${titleClass}` : `mt-4 ${titleClass}`} style={nameStyle}>
        {name}
      </NameTag>
      {tagline}
      {bio ? <div className="mt-1">{bio}</div> : null}
    </>
  );
}

function avatarImageStyle(page: PageContent) {
  const frame = imageFrame(page.avatarX, page.avatarY, page.avatarZoom);
  return placedImageStyle(frame.x, frame.y, frame.zoom);
}

function inkFor(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#111111";
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
function Avatar({
  page,
  theme,
  name,
  className,
  onBand = false,
}: {
  page: PageContent;
  theme: Theme;
  name: string;
  className: string;
  onBand?: boolean;
}) {
  const plainBackground = !theme.background.startsWith("linear");
  const fill =
    page.avatarColor ||
    (page.avatarUrl
      ? "#222"
      : onBand
        ? plainBackground
          ? theme.background
          : theme.buttonText
        : theme.button);
  const ink = page.avatarUrl
    ? theme.buttonText
    : page.avatarColor
      ? inkFor(page.avatarColor)
      : onBand
        ? plainBackground
          ? theme.text
          : theme.button
        : theme.buttonText;
  const borderWidth = page.avatarBorder ?? (page.avatarUrl || onBand ? 3 : 0);
  const borderColor = page.avatarBorderColor || "rgba(255,255,255,0.85)";

  return (
    <div
      className={`relative grid place-items-center overflow-hidden font-semibold ${className}`}
      style={{
        background: fill,
        color: ink,
        borderRadius: `${page.avatarRadius ?? 50}%`,
        border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
      }}
    >
      {page.avatarUrl ? (
        <span className="absolute inset-0 overflow-hidden">
          <PageMedia
            src={page.avatarUrl}
            alt={name.trim() ? name : ""}
            className="absolute max-w-none"
            style={avatarImageStyle(page)}
            sizes="96px"
          />
        </span>
      ) : (
        initials(name)
      )}
    </div>
  );
}
