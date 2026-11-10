"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { PageMedia } from "@/app/components/page-media";
import { useTranslations } from "@/app/components/translations-provider";
import { galleryIntervalSeconds } from "@/app/lib/blocks";
import type { GalleryBlock, GalleryItem } from "@/app/lib/types";
import type { Theme } from "@/app/lib/themes";

export function GalleryBlockFace({ block, theme }: { block: GalleryBlock; theme: Theme }) {
  const items = block.items.filter((item) => item.imageUrl?.trim());
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const radius = Math.max(0, block.borderRadius ?? 12);
  const heading = block.heading?.trim();

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {heading ? (
        <h3 className="mb-3 text-center text-base font-bold" style={{ color: theme.text }}>
          {heading}
        </h3>
      ) : null}
      {block.layout === "carousel" ? (
        <GalleryCarousel block={block} items={items} radius={radius} onOpen={setOpenIndex} />
      ) : block.layout === "masonry" ? (
        <GalleryMasonry items={items} radius={radius} onOpen={setOpenIndex} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, index) => (
            <GalleryTile key={item.id} item={item} radius={radius} className="aspect-square" cover onOpen={() => setOpenIndex(index)} />
          ))}
        </div>
      )}
      {openIndex !== null ? (
        <GalleryZoom
          items={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndex={(next) => setOpenIndex((next + items.length) % items.length)}
        />
      ) : null}
    </div>
  );
}

function GalleryMasonry({
  items,
  radius,
  onOpen,
}: {
  items: GalleryItem[];
  radius: number;
  onOpen: (index: number) => void;
}) {
  const columns = [items.filter((_, index) => index % 2 === 0), items.filter((_, index) => index % 2 === 1)];
  return (
    <div className="flex items-start gap-2">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-2">
          {column.map((item) => {
            const index = items.findIndex((entry) => entry.id === item.id);
            return (
              <GalleryTile
                key={item.id}
                item={item}
                radius={radius}
                className="w-full"
                onOpen={() => onOpen(index)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function GalleryTile({
  item,
  radius,
  className,
  cover = false,
  onOpen,
}: {
  item: GalleryItem;
  radius: number;
  className: string;
  cover?: boolean;
  onOpen?: () => void;
}) {
  const { t } = useTranslations();
  const src = item.imageUrl?.trim() ?? "";
  const media = (
    <PageMedia
      src={src}
      alt={item.alt?.trim() || ""}
      className={cover ? "absolute inset-0 size-full object-cover" : "h-auto w-full"}
      style={cover ? { width: "100%", height: "100%", objectFit: "cover" } : { width: "100%", height: "auto" }}
      sizes="240px"
    />
  );
  const frame = `overflow-hidden ${cover ? "relative" : ""} ${className}`;
  if (!onOpen) {
    return (
      <div className={frame} style={{ borderRadius: radius }}>
        {media}
      </div>
    );
  }
  return (
    <button
      type="button"
      className={`${frame} block w-full p-0 text-left`}
      style={{ borderRadius: radius }}
      aria-label={t("studio.blocks.gallery.zoom", "Pietuvināt")}
      onClick={onOpen}
    >
      {media}
    </button>
  );
}

function GalleryCarousel({
  block,
  items,
  radius,
  onOpen,
}: {
  block: GalleryBlock;
  items: GalleryItem[];
  radius: number;
  onOpen: (index: number) => void;
}) {
  const { t } = useTranslations();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const pausedRef = useRef(false);
  const count = items.length;
  const safeIndex = ((index % count) + count) % count;
  const seconds = galleryIntervalSeconds(block.intervalSeconds);
  const showProgress = Boolean(block.autoplay) && count > 1;

  useEffect(() => {
    if (!showProgress) {
      setProgress(0);
      return;
    }
    let elapsed = 0;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (!pausedRef.current) {
        elapsed += now - last;
        const ratio = elapsed / (seconds * 1000);
        if (ratio >= 1) {
          setProgress(0);
          setIndex((current) => (current + 1) % count);
          return;
        }
        setProgress(ratio);
      }
      last = now;
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [showProgress, safeIndex, seconds, count]);

  function setHoverPaused(event: PointerEvent, next: boolean) {
    if (event.pointerType === "touch") return;
    pausedRef.current = next;
  }

  function go(step: number) {
    setProgress(0);
    setIndex((current) => (current + step + count) % count);
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: radius }}
      role="region"
      aria-roledescription="carousel"
      aria-label={block.heading?.trim() || t("studio.block_type.gallery.label", "Galerija")}
      onPointerEnter={(event) => setHoverPaused(event, true)}
      onPointerLeave={(event) => setHoverPaused(event, false)}
      onPointerUp={(event) => {
        const start = Number(event.currentTarget.dataset.x ?? "");
        if (!Number.isFinite(start)) return;
        const delta = event.clientX - start;
        delete event.currentTarget.dataset.x;
        if (delta > 48) go(-1);
        else if (delta < -48) go(1);
        else if (!(event.target as HTMLElement).closest("button")) onOpen(safeIndex);
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        event.currentTarget.dataset.x = String(event.clientX);
      }}
    >
      <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${safeIndex * 100}%)` }}>
        {items.map((item) => (
          <div key={item.id} className="w-full shrink-0">
            <GalleryTile item={item} radius={0} className="aspect-[4/5]" cover />
          </div>
        ))}
      </div>
      {count > 1 ? (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white"
            aria-label={t("studio.blocks.gallery.prev", "Iepriekšējais")}
            onClick={() => go(-1)}
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white"
            aria-label={t("studio.blocks.gallery.next", "Nākamais")}
            onClick={() => go(1)}
          >
            <Chevron dir="right" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
            {items.map((item, itemIndex) => {
              const active = itemIndex === safeIndex;
              const wide = active && showProgress;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={t("studio.blocks.gallery.slide", "Attēls {current} no {total}", {
                    current: String(itemIndex + 1),
                    total: String(count),
                  })}
                  aria-current={active ? "true" : undefined}
                  className={`relative h-1.5 overflow-hidden rounded-full bg-white/40 transition-[width] duration-300 ${wide ? "w-8" : "w-1.5"} ${active && !wide ? "bg-white" : ""}`}
                  onClick={() => {
                    setProgress(0);
                    setIndex(itemIndex);
                  }}
                >
                  {wide ? (
                    <span className="absolute inset-y-0 left-0 bg-white" style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

function GalleryZoom({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const { t } = useTranslations();
  const item = items[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (event.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);

  if (!item || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("studio.blocks.gallery.zoom", "Pietuvināt")}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/15 text-2xl text-white"
        aria-label={t("actions.close", "Aizvērt")}
        onClick={onClose}
      >
        ×
      </button>
      {items.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
            aria-label={t("studio.blocks.gallery.prev", "Iepriekšējais")}
            onClick={(event) => {
              event.stopPropagation();
              onIndex((index - 1 + items.length) % items.length);
            }}
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"
            aria-label={t("studio.blocks.gallery.next", "Nākamais")}
            onClick={(event) => {
              event.stopPropagation();
              onIndex((index + 1) % items.length);
            }}
          >
            <Chevron dir="right" />
          </button>
        </>
      ) : null}
      <div className="max-h-[90vh] max-w-[92vw]" onClick={(event) => event.stopPropagation()}>
        <PageMedia
          src={item.imageUrl?.trim() ?? ""}
          alt={item.alt?.trim() || ""}
          className="max-h-[90vh] max-w-[92vw] object-contain"
          style={{ width: "auto", height: "auto", maxHeight: "90vh", maxWidth: "92vw" }}
          sizes="92vw"
        />
      </div>
    </div>,
    document.body,
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={dir === "left" ? "M14 6 8 12l6 6" : "M10 6l6 6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
