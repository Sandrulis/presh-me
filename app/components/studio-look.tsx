"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { BlockStyleFields, blockHasStyles } from "@/app/components/block-style-fields";
import { ColorPicker } from "@/app/components/color-picker";
import { FontSelect, FontSizeSelect } from "@/app/components/font-select";
import { BannerContentAlignSwitch, BannerContentSwitch, HeaderLayoutSwitch } from "@/app/components/header-layout-switch";
import { ImageDropField } from "@/app/components/image-drop-field";
import { StudioGroup, StudioMenu, StudioScreen } from "@/app/components/studio-nav";
import { useTranslations } from "@/app/components/translations-provider";
import { blockDisplayTitle, blockTypeLabel } from "@/app/lib/blocks";
import { imageFrame, pageImageFrame, panLimits, placedImageStyle } from "@/app/lib/image-frame";
import { getTheme, themes } from "@/app/lib/themes";
import type { BlockType, FontId, Portfolio } from "@/app/lib/types";

type LookId = "theme" | "header" | "avatar" | "text" | "page" | "icons" | "blocks";

export function LookColumn({
  page,
  update,
  onError,
}: {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
  onError: (message: string) => void;
}) {
  const { t } = useTranslations();
  const [view, setView] = useState<LookId | null>(null);
  const [styleBlockId, setStyleBlockId] = useState<string | null>(null);
  const theme = getTheme(page.themeId);
  const themeHex = /^#[0-9a-fA-F]{6}$/.test(theme.background) ? theme.background : "#f4f6f8";
  const layout = page.headerLayout ?? "center";
  const styleableBlocks = page.blocks.filter(blockHasStyles);
  const styleBlock = styleBlockId ? (page.blocks.find((item) => item.id === styleBlockId) ?? null) : null;

  useEffect(() => {
    if (styleBlockId && !page.blocks.some((item) => item.id === styleBlockId)) {
      setStyleBlockId(null);
    }
  }, [page.blocks, styleBlockId]);

  useEffect(() => {
    if (view === "blocks" && styleableBlocks.length === 0) {
      setView(null);
      setStyleBlockId(null);
    }
  }, [styleableBlocks.length, view]);

  if (!view) {
    return (
      <StudioMenu
        title={t("studio.panel.look", "Izskats")}
        hint={t("studio.look.hint", "Tēma, galvene, teksts un ikonas. Skats vidū mainās uzreiz.")}
        items={[
          { id: "theme", title: t("studio.look.themes", "Tēmas"), hint: t("studio.look.themes.hint", "Lapas krāsu komplekts."), icon: <SwatchIcon /> },
          { id: "header", title: t("studio.look.header", "Galvene"), hint: t("studio.look.header.hint", "Izkārtojums, fons un pāreja."), icon: <LayoutIcon /> },
          {
            id: "avatar",
            title: t("onboarding.profile.image", "Profila attēls"),
            hint: t("onboarding.profile.image_hint", "Bilde, forma un apmale."),
            icon: <UserIcon />,
          },
          { id: "text", title: t("studio.look.text", "Teksts"), hint: t("studio.look.text.hint", "Fonti, krāsas un izmēri."), icon: <TypeIcon /> },
          { id: "page", title: t("studio.look.page_bg", "Lapas fons"), hint: t("studio.look.page_bg.hint", "Fona krāsa vai attēls."), icon: <PageIcon /> },
          {
            id: "icons",
            title: t("onboarding.socials.title", "Sociālās ikonas"),
            hint: t("onboarding.socials.hint", "Ikonu izmērs lapā."),
            icon: <ShareIcon />,
          },
          ...(styleableBlocks.length > 0
            ? [
                {
                  id: "blocks" as const,
                  title: t("studio.look.block_style", "Bloku stils"),
                  hint: t("studio.look.block_style.hint", "Pievienoto bloku krāsas, fonti un robežas."),
                  icon: <BlocksStyleIcon />,
                },
              ]
            : []),
        ]}
        onOpen={(id) => {
          setStyleBlockId(null);
          setView(id as LookId);
        }}
      />
    );
  }

  if (view === "blocks") {
    if (styleBlock) {
      return (
        <StudioScreen
          title={blockDisplayTitle(styleBlock)}
          onBack={() => setStyleBlockId(null)}
        >
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {t(`studio.block_type.${styleBlock.type}.label`, blockTypeLabel(styleBlock.type))}
          </p>
          <BlockStyleFields
            block={styleBlock}
            onChange={(next) =>
              update({
                blocks: page.blocks.map((item) => (item.id === next.id ? next : item)),
              })
            }
          />
        </StudioScreen>
      );
    }

    return (
      <StudioScreen
        title={t("studio.look.block_style", "Bloku stils")}
        onBack={() => {
          setStyleBlockId(null);
          setView(null);
        }}
      >
        <div className="flex flex-col gap-2">
          {styleableBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => setStyleBlockId(block.id)}
              className="choice flex items-center gap-2.5 !px-[0.6rem] !py-[0.54rem]"
            >
              <span className="grid size-5 shrink-0 place-items-center text-[var(--ink)]" aria-hidden="true">
                <BlockStyleIcon type={block.type} />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-semibold leading-snug">{blockDisplayTitle(block)}</span>
                <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">
                  {t(`studio.block_type.${block.type}.label`, blockTypeLabel(block.type))}
                </span>
              </span>
              <LookChevron />
            </button>
          ))}
        </div>
      </StudioScreen>
    );
  }

  const title = {
    theme: t("studio.look.themes", "Tēmas"),
    header: t("studio.look.header", "Galvene"),
    avatar: t("onboarding.profile.image", "Profila attēls"),
    text: t("studio.look.text", "Teksts"),
    page: t("studio.look.page_bg", "Lapas fons"),
    icons: t("onboarding.socials.title", "Sociālās ikonas"),
    blocks: t("studio.look.block_style", "Bloku stils"),
  }[view];

  return (
    <StudioScreen title={title} onBack={() => setView(null)}>
      {view === "theme" ? (
        <div className="grid grid-cols-2 gap-2">
          {themes.map((item) => {
            const selected = page.themeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => update({ themeId: item.id })}
                aria-pressed={selected}
                className="choice overflow-hidden !p-0"
                data-selected={selected || undefined}
                style={{ borderColor: selected ? "var(--accent)" : undefined }}
              >
                <span className="block h-14" style={{ background: item.background }} />
                <span className="block px-2.5 py-2 text-sm font-semibold">{item.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {view === "header" ? (
        <>
          <StudioGroup title={t("studio.look.layout", "Izkārtojums")}>
            <div className="mt-3 flex justify-center">
              <HeaderLayoutSwitch value={layout} onChange={(headerLayout) => update({ headerLayout })} />
            </div>
          </StudioGroup>
          {layout !== "center" ? (
            <>
              {layout === "banner-left" ? (
                <StudioGroup title={t("studio.look.content_place", "Satura vieta")}>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <BannerContentSwitch
                      value={page.bannerContentPlace ?? "beside"}
                      onChange={(bannerContentPlace) => update({ bannerContentPlace })}
                    />
                    <BannerContentAlignSwitch
                      value={page.bannerContentAlign ?? ((page.bannerContentPlace ?? "beside") === "above" ? "center" : "left")}
                      onChange={(bannerContentAlign) => update({ bannerContentAlign })}
                    />
                  </div>
                  <RangeField label={t("onboarding.content_align", "Satura vertikāle")} min={0} max={100} value={page.bannerContentY ?? 50} suffix=" %" onChange={(bannerContentY) => update({ bannerContentY })} />
                </StudioGroup>
              ) : null}
              <StudioGroup title={t("studio.look.background", "Fons")}>
                <ColorRow label={t("onboarding.bg_color", "Fona krāsa")} value={page.bannerColor ?? "#111111"} onChange={(bannerColor) => update({ bannerColor })} />
                <ImageField
                  title={t("onboarding.image.bg", "Fona attēls")}
                  src={page.bannerUrl}
                  x={page.bannerX}
                  y={page.bannerY}
                  zoom={page.bannerZoom}
                  wide
                  onFile={(file) =>
                    void readCover(
                      file,
                      960,
                      420,
                      (bannerUrl) => update({ bannerUrl }),
                      onError,
                      t("onboarding.image.pick", "Izvēlies attēlu."),
                      t("onboarding.image.read_error", "Neizdevās nolasīt attēlu."),
                    )
                  }
                  onClear={page.bannerUrl ? () => update({ bannerUrl: null }) : undefined}
                />
                {page.bannerUrl ? (
                  <ImagePlace
                    x={page.bannerX ?? 50}
                    y={page.bannerY ?? 50}
                    zoom={page.bannerZoom ?? 100}
                    onChange={({ x, y, zoom }) => update({ bannerX: x, bannerY: y, bannerZoom: zoom })}
                  />
                ) : null}
                <RangeField label={t("studio.look.height", "Augstums")} min={18} max={85} value={page.bannerHeight ?? 40} suffix=" %" onChange={(bannerHeight) => update({ bannerHeight })} />
                <RangeField
                  label={t("onboarding.transition", "Pāreja")}
                  min={0}
                  max={100}
                  value={page.bannerFadeAmount ?? (page.bannerFade ? 40 : 0)}
                  suffix=" %"
                  onChange={(bannerFadeAmount) => update({ bannerFadeAmount, bannerFade: bannerFadeAmount > 0 })}
                />
              </StudioGroup>
            </>
          ) : null}
        </>
      ) : null}

      {view === "avatar" ? (
        <StudioGroup>
          <ImageField
            title={t("onboarding.image.title", "Attēls")}
            src={page.avatarUrl}
            x={page.avatarX}
            y={page.avatarY}
            zoom={page.avatarZoom}
            onFile={(file) =>
              void readCover(
                file,
                256,
                256,
                (avatarUrl) => update({ avatarUrl }),
                onError,
                t("onboarding.image.pick", "Izvēlies attēlu."),
                t("onboarding.image.read_error", "Neizdevās nolasīt attēlu."),
              )
            }
            onClear={page.avatarUrl ? () => update({ avatarUrl: null }) : undefined}
          />
          {page.avatarUrl ? (
            <ImagePlace
              x={page.avatarX ?? 50}
              y={page.avatarY ?? 50}
              zoom={page.avatarZoom ?? 100}
              onChange={({ x, y, zoom }) => update({ avatarX: x, avatarY: y, avatarZoom: zoom })}
            />
          ) : null}
          <ColorRow label={t("onboarding.icon_bg", "Ikonas fons")} value={page.avatarColor ?? "#eef1f6"} onChange={(avatarColor) => update({ avatarColor })} />
          <RangeField label={t("onboarding.avatar_radius", "Noapaļojums")} min={0} max={50} value={page.avatarRadius ?? 50} suffix="%" onChange={(avatarRadius) => update({ avatarRadius })} />
          <RangeField label={t("studio.look.border_width", "Apmales biezums")} min={0} max={16} value={page.avatarBorder ?? 0} suffix=" px" onChange={(avatarBorder) => update({ avatarBorder })} />
          <ColorRow label={t("onboarding.border_color", "Apmales krāsa")} value={page.avatarBorderColor ?? "#ffffff"} onChange={(avatarBorderColor) => update({ avatarBorderColor })} />
        </StudioGroup>
      ) : null}

      {view === "text" ? (
        <>
          <StudioGroup title={t("studio.look.page_font", "Lapas fonts")}>
            <div className="mt-2">
              <FontSelect value={page.fontId ?? "sans"} onChange={(fontId) => update({ fontId })} label={t("studio.look.page_font", "Lapas fonts")} />
            </div>
          </StudioGroup>
          <StudioGroup title={t("common.name", "Vārds")}>
            <TextTune
              color={page.nameColor}
              fallbackColor={theme.text}
              fontId={page.nameFontId ?? page.fontId ?? "sans"}
              size={page.nameFontSize ?? (layout === "banner-left" ? 30 : 36)}
              onColor={(nameColor) => update({ nameColor })}
              onFont={(nameFontId) => update({ nameFontId })}
              onSize={(nameFontSize) => update({ nameFontSize })}
            />
            <RangeField
              label={t("studio.look.name_stroke_width", "Burtu apmales biezums")}
              min={0}
              max={8}
              value={page.nameStrokeWidth ?? 0}
              suffix=" px"
              onChange={(nameStrokeWidth) => update({ nameStrokeWidth })}
            />
            <ColorRow
              label={t("studio.look.name_stroke_color", "Burtu apmales krāsa")}
              value={page.nameStrokeColor ?? "#111111"}
              onChange={(nameStrokeColor) => update({ nameStrokeColor })}
            />
          </StudioGroup>
          <StudioGroup title={t("studio.profile.tagline", "Tagline")}>
            <TextTune
              color={page.taglineColor}
              fallbackColor={theme.muted}
              fontId={page.taglineFontId ?? page.fontId ?? "sans"}
              size={page.taglineFontSize ?? 13}
              onColor={(taglineColor) => update({ taglineColor })}
              onFont={(taglineFontId) => update({ taglineFontId })}
              onSize={(taglineFontSize) => update({ taglineFontSize })}
            />
          </StudioGroup>
          <StudioGroup title={t("studio.profile.bio", "Bio")}>
            <TextTune
              color={page.bioColor}
              fallbackColor={theme.muted}
              fontId={page.bioFontId ?? page.fontId ?? "sans"}
              size={page.bioFontSize ?? 14}
              onColor={(bioColor) => update({ bioColor })}
              onFont={(bioFontId) => update({ bioFontId })}
              onSize={(bioFontSize) => update({ bioFontSize })}
            />
          </StudioGroup>
        </>
      ) : null}

      {view === "page" ? (
        <StudioGroup>
          <ColorRow
            label={t("onboarding.bg_color", "Fona krāsa")}
            value={page.pageColor ?? themeHex}
            onChange={(pageColor) => update({ pageColor })}
            sampleImageUrl={page.pageImageUrl}
          />
          <ImageField
            title={t("onboarding.image.bg", "Fona attēls")}
            src={page.pageImageUrl}
            x={pageImageFrame(page.pageImagePosition, page.pageImageX, page.pageImageY, page.pageImageZoom).x}
            y={pageImageFrame(page.pageImagePosition, page.pageImageX, page.pageImageY, page.pageImageZoom).y}
            zoom={pageImageFrame(page.pageImagePosition, page.pageImageX, page.pageImageY, page.pageImageZoom).zoom}
            onFile={(file) =>
              void readFit(
                file,
                (pageImageUrl) => update({ pageImageUrl }),
                onError,
                t("onboarding.image.pick", "Izvēlies attēlu."),
                t("onboarding.image.read_error", "Neizdevās nolasīt attēlu."),
              )
            }
            onClear={page.pageImageUrl ? () => update({ pageImageUrl: null }) : undefined}
          />
          {page.pageImageUrl ? (
            <ImagePlace
              x={pageImageFrame(page.pageImagePosition, page.pageImageX, page.pageImageY, page.pageImageZoom).x}
              y={pageImageFrame(page.pageImagePosition, page.pageImageX, page.pageImageY, page.pageImageZoom).y}
              zoom={pageImageFrame(page.pageImagePosition, page.pageImageX, page.pageImageY, page.pageImageZoom).zoom}
              onChange={({ x, y, zoom }) => update({ pageImageX: x, pageImageY: y, pageImageZoom: zoom })}
            />
          ) : null}
        </StudioGroup>
      ) : null}

      {view === "icons" ? (
        <StudioGroup title={t("onboarding.socials.title", "Sociālās ikonas")}>
          <RangeField label={t("onboarding.icon_size", "Ikonu izmērs")} min={24} max={72} value={page.socialIconSize ?? 40} suffix=" px" onChange={(socialIconSize) => update({ socialIconSize })} />
        </StudioGroup>
      ) : null}
    </StudioScreen>
  );
}

function ColorRow({
  label,
  value,
  onChange,
  sampleImageUrl,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sampleImageUrl?: string | null;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#111111";
  return (
    <div className="mt-3 flex items-center gap-3">
      <ColorPicker label={label} value={safe} onChange={onChange} sampleImageUrl={sampleImageUrl} />
      <span className="text-sm text-[var(--muted)]">{label}</span>
    </div>
  );
}

function TextTune({
  color,
  fallbackColor,
  fontId,
  size,
  onColor,
  onFont,
  onSize,
}: {
  color: string | undefined;
  fallbackColor: string;
  fontId: FontId;
  size: number;
  onColor: (value: string) => void;
  onFont: (value: FontId) => void;
  onSize: (value: number) => void;
}) {
  const { t } = useTranslations();
  return (
    <div className="mt-2 flex items-center gap-2">
      <ColorPicker label={t("onboarding.color", "Krāsa")} value={color ?? fallbackColor} onChange={onColor} />
      <FontSelect value={fontId} onChange={onFont} />
      <FontSizeSelect value={size} onChange={onSize} />
    </div>
  );
}

function ImageField({
  title,
  src,
  x,
  y,
  zoom,
  wide,
  onFile,
  onClear,
}: {
  title: string;
  src?: string | null;
  x?: number;
  y?: number;
  zoom?: number;
  wide?: boolean;
  onFile: (file: File | undefined) => void;
  onClear?: () => void;
}) {
  const { t } = useTranslations();
  const [ask, setAsk] = useState(false);
  return (
    <div className="mt-3">
      <ImageDropField
        title={title}
        onFile={onFile}
        preview={
          <span className="relative inline-flex shrink-0">
            <span className={`relative block overflow-hidden rounded-md bg-[#eef1f6] ${wide ? "h-14 w-24" : "h-14 w-14"}`}>
              {src ? <Thumb src={src} x={x} y={y} zoom={zoom} /> : <span className="grid h-full place-items-center text-xs text-[var(--muted)]">+</span>}
            </span>
            {src && onClear ? (
              <button
                type="button"
                aria-label={t("actions.delete", "Dzēst")}
                className="absolute top-0 right-0 z-10 grid size-5 translate-x-1/3 -translate-y-1/3 place-items-center rounded-full bg-[#111] text-white ring-2 ring-white"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setAsk(true);
                }}
              >
                <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </span>
        }
      />
      {ask && onClear ? (
        <ConfirmDelete
          onCancel={() => setAsk(false)}
          onConfirm={() => {
            setAsk(false);
            onClear();
          }}
        />
      ) : null}
    </div>
  );
}

function ConfirmDelete({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslations();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCancel();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#0e1116]/40 p-5"
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.delete_image.title", "Dzēst attēlu?")}
      onMouseDown={onCancel}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(14,17,22,0.18)]" onMouseDown={(event) => event.stopPropagation()}>
        <h2 className="font-display text-xl font-bold tracking-[-0.03em]">{t("onboarding.delete_image.title", "Dzēst attēlu?")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t("onboarding.delete_image.body", "Vai tiešām vēlies dzēst šo attēlu?")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-line" onClick={onCancel}>
            {t("actions.cancel", "Atcelt")}
          </button>
          <button type="button" className="btn-ink" style={{ background: "#c43b3b" }} onClick={onConfirm}>
            {t("actions.delete", "Dzēst")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Thumb({ src, x, y, zoom }: { src: string; x?: number; y?: number; zoom?: number }) {
  const frame = imageFrame(x, y, zoom);
  return <img src={src} alt="" className="absolute max-w-none" style={placedImageStyle(frame.x, frame.y, frame.zoom)} />;
}

function ImagePlace({
  x,
  y,
  zoom,
  onChange,
}: {
  x: number;
  y: number;
  zoom: number;
  onChange: (frame: { x: number; y: number; zoom: number }) => void;
}) {
  const { t } = useTranslations();
  const frame = imageFrame(x, y, zoom);
  const limits = panLimits(frame.zoom);
  const locked = limits.min === limits.max;
  return (
    <>
      <RangeField label={t("onboarding.horizontal", "Horizontāli")} min={limits.min} max={limits.max} value={frame.x} suffix=" %" disabled={locked} onChange={(next) => onChange(imageFrame(next, frame.y, frame.zoom))} />
      <RangeField label={t("onboarding.vertical", "Vertikāli")} min={limits.min} max={limits.max} value={frame.y} suffix=" %" disabled={locked} onChange={(next) => onChange(imageFrame(frame.x, next, frame.zoom))} />
      <RangeField label={t("onboarding.zoom", "Pietuvinājums")} min={100} max={200} value={frame.zoom} suffix=" %" onChange={(next) => onChange(imageFrame(frame.x, frame.y, next))} />
    </>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  suffix,
  disabled = false,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  suffix: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <label className={`mt-3 block ${disabled ? "opacity-45" : ""}`}>
      <span className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="rounded-md bg-[#eef1f6] px-2 py-0.5 text-[var(--muted)] tabular-nums">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full disabled:cursor-not-allowed"
        style={{ "--range-fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}

async function readCover(
  file: File | undefined,
  width: number,
  height: number,
  onUrl: (url: string) => void,
  onError: (message: string) => void,
  pickError: string,
  readError: string,
) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    onError(pickError);
    return;
  }
  const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
  const result = await processAndUploadImage(file, {
    mode: "cover",
    width,
    height,
    folder: "look",
  });
  if (!result.ok) {
    onError(result.error === "Izvēlies attēlu." ? pickError : readError);
    return;
  }
  onUrl(result.url);
}

async function readFit(
  file: File | undefined,
  onUrl: (url: string) => void,
  onError: (message: string) => void,
  pickError: string,
  readError: string,
) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    onError(pickError);
    return;
  }
  const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
  const result = await processAndUploadImage(file, { mode: "fit", maxEdge: 1400, folder: "look" });
  if (!result.ok) {
    onError(result.error === "Izvēlies attēlu." ? pickError : readError);
    return;
  }
  onUrl(result.url);
}

function SwatchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.4" />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M5 7V5.5h14V7M12 5.5V18.5M9 18.5h6" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M12 4.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6Z" />
      <path d="M12 4.2c2 2.2 3 4.8 3 7.8s-1 5.6-3 7.8c-2-2.2-3-4.8-3-7.8s1-5.6 3-7.8Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="17" cy="7" r="2.25" />
      <circle cx="17" cy="17" r="2.25" />
      <path d="m8 11 7-3M8 13l7 3" />
    </svg>
  );
}

function BlocksStyleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <path d="M14.5 15.5h4M16.5 13.5v4" strokeLinecap="round" />
    </svg>
  );
}

function BlockStyleIcon({ type }: { type: BlockType }) {
  const label = blockTypeLabel(type).slice(0, 2);
  return (
    <span className="grid size-5 place-items-center text-[0.65rem] font-bold tracking-tight" aria-hidden="true">
      {label}
    </span>
  );
}

function LookChevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
