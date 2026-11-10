"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToggleSwitch } from "@/app/components/admin-ui";
import { BlockStyleFields, RangeRow } from "@/app/components/block-style-fields";
import { DropLine } from "@/app/components/drop-line";
import { FieldFrame } from "@/app/components/field-frame";
import { BookingBlockFields } from "@/app/components/studio-booking-editor";
import { useTranslations } from "@/app/components/translations-provider";
import { ImageDropField } from "@/app/components/image-drop-field";
import {
  BLOCK_TYPE_OPTIONS,
  blockDisplayHint,
  blockDisplayTitle,
  blockIsComplete,
  blockTypeLabel,
  emptyBlock,
  emptyFaqItem,
  emptyPollOption,
  emptyResumeItem,
  emptyGalleryItem,
  emptyProductItem,
  galleryIntervalSeconds,
  emptyServiceItem,
  emptySkillItem,
  formatItemPrice,
  PRICE_CURRENCIES,
  clampSkillRating,
  googleMapsEmbedUrl,
  isGoogleMapsShortLink,
  mapsBlockUrlAccepted,
  readImageFile,
  videoEmbedUrl,
} from "@/app/lib/blocks";
import { normalizeLinkUrl, isValidLinkUrl } from "@/app/lib/urls";
import { commitDropReorder, dropWouldMove, edgeFromPointer, type DropTarget } from "@/app/lib/dnd-reorder";
import type {
  BlockType,
  FaqBlock,
  FaqBlockItem,
  InstagramBlock,
  XBlock,
  LinkBlock,
  MapsBlock,
  PollBlock,
  PollOption,
  PageBlock,
  VideoBlock,
  Portfolio,
  ResumeBlock,
  ResumeItem,
  CountdownBlock,
  GalleryBlock,
  GalleryItem,
  GalleryLayout,
  ProductItem,
  ProductsBlock,
  ServiceItem,
  ServicesBlock,
  SkillItem,
  SkillsBlock,
} from "@/app/lib/types";
import {
  clampCountdownDuration,
  countdownCombineDateTime,
  countdownDateTimeParts,
} from "@/app/lib/countdown-block";

export function BlocksEditor({
  page,
  update,
  onPreviewDraft,
  onBlockDrawerOpen,
}: {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
  onPreviewDraft?: (draft: PageBlock | null) => void;
  onBlockDrawerOpen?: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [creating, setCreating] = useState<PageBlock | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const editing = page.blocks.find((item) => item.id === editId) ?? null;
  const blockIds = page.blocks.map((item) => item.id);
  const hasBookingBlock = page.blocks.some((block) => block.type === "booking");
  const blockDrawerOpen = Boolean(creating || editing || pickerOpen);
  const onPreviewDraftRef = useRef(onPreviewDraft);
  onPreviewDraftRef.current = onPreviewDraft;
  useEffect(() => {
    onPreviewDraftRef.current?.(creating);
    return () => onPreviewDraftRef.current?.(null);
  }, [creating]);

  const onBlockDrawerOpenRef = useRef(onBlockDrawerOpen);
  onBlockDrawerOpenRef.current = onBlockDrawerOpen;
  useEffect(() => {
    onBlockDrawerOpenRef.current?.(blockDrawerOpen);
    return () => onBlockDrawerOpenRef.current?.(false);
  }, [blockDrawerOpen]);

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function startCreate(type: BlockType) {
    setPickerOpen(false);
    setCreating(emptyBlock(type));
  }

  function saveCreating() {
    if (!creating || !blockIsComplete(creating)) return;
    update({ blocks: [...page.blocks, creating] });
  }

  function replaceBlock(id: string, next: PageBlock) {
    update({
      blocks: page.blocks.map((item) => (item.id === id ? next : item)),
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          className="btn-line gap-1 px-2.5 py-1.5 text-[0.64rem] leading-none"
          onClick={() => setPickerOpen(true)}
        >
          <span aria-hidden="true">+</span>
          {t("actions.add", "Pievienot")}
        </button>
      </div>

      {page.blocks.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{t("studio.blocks.empty", "Pievieno blokus. Secību maini ar vilkšanu.")}</p>
      ) : null}

      <ul className="mt-3 flex flex-col gap-2">
          {page.blocks.map((block) => {
            const dragging = dragId === block.id;
            const incomplete = !blockIsComplete(block);
            const showLine = Boolean(dragId && drop && drop.id === block.id && dropWouldMove(blockIds, dragId, drop));
            return (
              <li
                key={block.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === block.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: block.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === block.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(page.blocks, fromId, target);
                    if (next) update({ blocks: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", block.id);
                      setDragId(block.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => setEditId(block.id)}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--paper)] text-[0.65rem] font-bold text-[var(--ink)]">
                      {t(`studio.block_type.${block.type}.label`, blockTypeLabel(block.type)).slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{blockDisplayTitle(block)}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{blockDisplayHint(block)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.edit", "Labot")}
                    title={t("actions.edit", "Labot")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    onClick={() => setEditId(block.id)}
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                    onClick={() => update({ blocks: page.blocks.filter((item) => item.id !== block.id) })}
                  >
                    <IconTrash />
                  </button>
                </div>
                {incomplete ? (
                  <p
                    className="mt-1.5 rounded-lg bg-[var(--stamp)] px-2 py-1.5 text-center text-xs leading-snug text-white"
                    role="status"
                  >
                    {t("studio.blocks.incomplete", "Šim blokam nav ievadītas visas nepieciešamās detaļas.")}
                  </p>
                ) : null}
              </li>
            );
          })}
      </ul>

      {pickerOpen ? (
        <BlockTypePicker
          onClose={() => setPickerOpen(false)}
          onPick={startCreate}
          hasBookingBlock={hasBookingBlock}
        />
      ) : null}

      {creating ? (
        <BlockEditDrawer
          page={page}
          block={creating}
          mode="create"
          onClose={() => setCreating(null)}
          onChange={setCreating}
          onSave={saveCreating}
        />
      ) : null}

      {editing && !creating ? (
        <BlockEditDrawer
          page={page}
          block={editing}
          mode="edit"
          onClose={() => setEditId(null)}
          onChange={(next) => replaceBlock(editing.id, next)}
        />
      ) : null}
    </>
  );
}

function BlockTypePicker({
  onClose,
  onPick,
  hasBookingBlock,
}: {
  onClose: () => void;
  onPick: (type: BlockType) => void;
  hasBookingBlock: boolean;
}) {
  const { t } = useTranslations();
  return (
    <SideDrawer
      title={t("studio.blocks.add_dialog_title", "Pievienot bloku")}
      hint={t("studio.blocks.add_dialog_hint", "Izvēlies bloka veidu.")}
      onClose={onClose}
      ariaLabel={t("studio.blocks.add_dialog_title", "Pievienot bloku")}
      footer={(close) => (
        <button type="button" className="btn-line w-full" onClick={close}>
          {t("actions.cancel", "Atcelt")}
        </button>
      )}
    >
      <div className="flex flex-col gap-2">
        {BLOCK_TYPE_OPTIONS.filter((item) => item.id !== "booking" || !hasBookingBlock).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-left hover:border-[var(--accent)] hover:bg-[var(--paper)]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--paper)] text-xs font-bold text-[var(--ink)]">
              {t(`studio.block_type.${item.id}.label`, item.label).slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{t(`studio.block_type.${item.id}.label`, item.label)}</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">{t(`studio.block_type.${item.id}.hint`, item.hint)}</span>
            </span>
          </button>
        ))}
      </div>
    </SideDrawer>
  );
}

function BlockEditDrawer({
  page,
  block,
  mode,
  onClose,
  onChange,
  onSave,
}: {
  page: Portfolio;
  block: PageBlock;
  mode: "create" | "edit";
  onClose: () => void;
  onChange: (next: PageBlock) => void;
  onSave?: () => void;
}) {
  const { t } = useTranslations();
  const canSave = mode !== "create" || blockIsComplete(block);

  return (
    <SideDrawer
      title={t(`studio.block_type.${block.type}.label`, blockTypeLabel(block.type))}
      hint={mode === "create" ? t("studio.blocks.create_hint", "Aizpildi detaļas — priekšskats vidū") : t("studio.blocks.edit_hint", "Labo bloka detaļas")}
      onClose={onClose}
      ariaLabel={mode === "create" ? t("studio.blocks.new_aria", "Jauns bloks") : t("studio.blocks.edit_aria", "Labot bloku")}
      footer={(close) =>
        mode === "create" ? (
          <div className="flex gap-2">
            <button type="button" className="btn-line flex-1" onClick={close}>
              {t("actions.cancel", "Atcelt")}
            </button>
            <button
              type="button"
              className="btn-ink flex-1"
              onClick={() => {
                if (!canSave) return;
                onSave?.();
                close();
              }}
              disabled={!canSave}
            >
              {t("actions.save", "Saglabāt")}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ink w-full" onClick={close}>
            {t("common.done", "Gatavs")}
          </button>
        )
      }
    >
      <BlockFields page={page} block={block} onChange={onChange} />
    </SideDrawer>
  );
}

function BlockFields({
  page,
  block,
  onChange,
}: {
  page: Portfolio;
  block: PageBlock;
  onChange: (next: PageBlock) => void;
}) {
  const { t } = useTranslations();
  const optionalPh = t("common.optional", "Nav obligāts");
  switch (block.type) {
    case "link":
      return (
        <>
          <FieldFrame label={t("common.title", "Nosaukums")}>
            <input className="auth-field" autoFocus placeholder={t("common.title", "Nosaukums")} value={block.title} maxLength={80} onChange={(e) => onChange({ ...block, title: e.target.value })} />
          </FieldFrame>
          <FieldFrame label={t("common.link", "Saite")}>
            <LinkUrlInput block={block} onChange={onChange} />
          </FieldFrame>
          <FieldFrame label={t("studio.blocks.field.note", "Piezīme")}>
            <input className="auth-field" placeholder={optionalPh} value={block.note} maxLength={80} onChange={(e) => onChange({ ...block, note: e.target.value })} />
          </FieldFrame>
          <div className="mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
        </>
      );
    case "text":
      return (
        <>
          <BlockStyleFields block={block} onChange={onChange} />
          <div className="mt-4">
            <FieldFrame label={t("common.text", "Teksts")}>
              <textarea className="auth-area min-h-[12rem]" autoFocus placeholder={t("studio.blocks.text_ph", "Iekopē vai ieraksti tekstu.")} value={block.body} onChange={(e) => onChange({ ...block, body: e.target.value })} />
            </FieldFrame>
          </div>
        </>
      );
    case "video":
      return (
        <>
          <FieldFrame label={t("studio.blocks.field.video_url", "Video saite")}>
            <VideoUrlInput block={block} onChange={onChange} />
          </FieldFrame>
          <FieldFrame label={t("studio.blocks.field.video_title", "Virsraksts")}>
            <input className="auth-field" placeholder={optionalPh} value={block.title ?? ""} maxLength={80} onChange={(e) => onChange({ ...block, title: e.target.value })} />
          </FieldFrame>
          <div className="mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
        </>
      );
    case "image":
      return (
        <>
          <ImageDropField
            title={t("onboarding.image.title", "Attēls")}
            hint={t("studio.blocks.field.image_drop_hint", "Ievelc vai izvēlies failu.")}
            preview={
              block.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={block.src} alt="" className="max-h-40 rounded-lg object-cover" />
              ) : (
                <span className="text-sm text-[var(--muted)]">{t("studio.blocks.field.no_image", "Nav attēla")}</span>
              )
            }
            onFile={(file) =>
              void readImageFile(
                file,
                (src) => onChange({ ...block, src }),
                () => {},
              )
            }
          />
          {block.src ? (
            <button type="button" className="btn-line mt-2 w-full" onClick={() => onChange({ ...block, src: null })}>
              {t("studio.blocks.remove_image", "Noņemt attēlu")}
            </button>
          ) : null}
          <FieldFrame label={t("studio.blocks.field.alt", "Apraksts")}>
            <input className="auth-field" placeholder={t("studio.blocks.field.alt_ph", "Alt teksts (nav obligāts)")} value={block.alt} maxLength={120} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
          </FieldFrame>
          <div className="mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
        </>
      );
    case "audio":
      return (
        <>
          <FieldFrame label={t("studio.blocks.field.spotify_url", "Spotify saite")}>
            <input
              className="auth-field"
              autoFocus
              placeholder="https://open.spotify.com/track/…"
              value={block.url}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
            />
          </FieldFrame>
          <div className="mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
        </>
      );
    case "maps":
      return (
        <>
          <FieldFrame label={t("studio.blocks.field.maps_url", "Google Maps saite")}>
            <MapsUrlInput block={block} onChange={onChange} />
          </FieldFrame>
          <FieldFrame label={t("common.title", "Nosaukums")}>
            <input
              className="auth-field"
              placeholder={optionalPh}
              value={block.title ?? ""}
              maxLength={80}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("studio.blocks.field.maps_height", "Kartes augstums")}>
            <RangeRow
              label={t("studio.blocks.field.maps_height", "Kartes augstums")}
              min={160}
              max={480}
              value={block.height ?? 280}
              suffix=" px"
              onChange={(height) => onChange({ ...block, height })}
            />
          </FieldFrame>
          <div className="mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
        </>
      );
    case "resume":
      return (
        <>
          <div className="mb-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
          <ResumeItemsEditor block={block} onChange={onChange} />
        </>
      );
    case "instagram":
      return <InstagramFields block={block} onChange={onChange} />;
    case "x":
      return <XFields block={block} onChange={onChange} />;
    case "quote":
      return (
        <>
          <BlockStyleFields block={block} onChange={onChange} />
          <div className="mt-4">
            <FieldFrame label={t("studio.blocks.field.quote", "Citāts")}>
              <textarea className="auth-area min-h-[8rem]" autoFocus placeholder={t("studio.blocks.field.quote_ph", "Citāta teksts")} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
            </FieldFrame>
          </div>
          <FieldFrame label={t("studio.blocks.field.author", "Autors")}>
            <input className="auth-field" placeholder={optionalPh} value={block.author ?? ""} maxLength={80} onChange={(e) => onChange({ ...block, author: e.target.value })} />
          </FieldFrame>
        </>
      );
    case "countdown":
      return (
        <>
          <FieldFrame label={t("common.title", "Nosaukums")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("common.title", "Nosaukums")}
              value={block.title}
              maxLength={80}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("common.description", "Apraksts")}>
            <textarea
              className="auth-area min-h-[4.5rem]"
              placeholder={t("common.optional", "Nav obligāts")}
              value={block.description ?? ""}
              maxLength={200}
              onChange={(e) => onChange({ ...block, description: e.target.value })}
            />
          </FieldFrame>
          <CountdownTimingFields block={block} onChange={onChange} />
          <div className="mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
        </>
      );
    case "poll":
      return (
        <>
          <FieldFrame label={t("common.question", "Jautājums")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("studio.blocks.poll.question_ph", "Ko vēlies noskaidrot?")}
              value={block.question}
              maxLength={200}
              onChange={(e) => onChange({ ...block, question: e.target.value })}
            />
          </FieldFrame>
          <div className="mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
          <PollOptionsEditor block={block} onChange={onChange} />
        </>
      );
    case "skills":
      return (
        <>
          <FieldFrame label={t("studio.blocks.skills.heading", "Virsraksts")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={optionalPh}
              value={block.heading ?? ""}
              maxLength={80}
              onChange={(e) => onChange({ ...block, heading: e.target.value })}
            />
          </FieldFrame>
          <div className="mb-4 mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
          <SkillsItemsEditor block={block} onChange={onChange} />
        </>
      );
    case "services":
      return (
        <>
          <FieldFrame label={t("common.heading", "Virsraksts")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={optionalPh}
              value={block.heading ?? ""}
              maxLength={80}
              onChange={(e) => onChange({ ...block, heading: e.target.value })}
            />
          </FieldFrame>
          <div className="mb-4 mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
          <ServicesItemsEditor block={block} onChange={onChange} />
        </>
      );
    case "products":
      return (
        <>
          <FieldFrame label={t("common.heading", "Virsraksts")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={optionalPh}
              value={block.heading ?? ""}
              maxLength={80}
              onChange={(e) => onChange({ ...block, heading: e.target.value })}
            />
          </FieldFrame>
          <div className="mb-4 mt-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
          <ProductsItemsEditor block={block} onChange={onChange} />
        </>
      );
    case "gallery":
      return (
        <>
          <FieldFrame label={t("common.heading", "Virsraksts")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={optionalPh}
              value={block.heading ?? ""}
              maxLength={80}
              onChange={(e) => onChange({ ...block, heading: e.target.value })}
            />
          </FieldFrame>
          <div className="mb-4 mt-4">
            <p className="mb-2 text-sm font-medium">{t("studio.blocks.gallery.layout", "Veids")}</p>
            <GalleryLayoutSwitch
              value={block.layout}
              onChange={(layout) => onChange({ ...block, layout })}
            />
          </div>
          {block.layout === "carousel" ? (
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t("studio.blocks.gallery.autoplay", "Mainīt automātiski")}</p>
                {block.autoplay ? (
                  <label className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                    <span>{t("studio.blocks.gallery.interval", "Ik pēc sekundēm")}</span>
                    <span className="w-20 shrink-0">
                    <input
                      type="number"
                      min={2}
                      max={30}
                      inputMode="numeric"
                      aria-label={t("studio.blocks.gallery.interval", "Ik pēc sekundēm")}
                      className="auth-field px-2 text-center"
                      value={galleryIntervalSeconds(block.intervalSeconds)}
                      onChange={(event) =>
                        onChange({
                          ...block,
                          intervalSeconds: galleryIntervalSeconds(Number(event.target.value)),
                        })
                      }
                      />
                    </span>
                  </label>
                ) : null}
              </div>
              <ToggleSwitch
                checked={Boolean(block.autoplay)}
                label={t("studio.blocks.gallery.autoplay", "Mainīt automātiski")}
                onChange={(autoplay) =>
                  onChange({
                    ...block,
                    autoplay,
                    intervalSeconds: galleryIntervalSeconds(block.intervalSeconds),
                  })
                }
              />
            </div>
          ) : null}
          <div className="mb-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
          <GalleryItemsEditor block={block} onChange={onChange} />
        </>
      );
    case "faq":
      return (
        <>
          <div className="mb-4">
            <BlockStyleFields block={block} onChange={onChange} />
          </div>
          <FaqItemsEditor block={block} onChange={onChange} />
        </>
      );
    case "booking":
      return (
        <BookingBlockFields
          block={block}
          onChange={onChange}
          pageId={page.id}
          pageHandle={page.handle}
        />
      );
  }
}

function VideoUrlInput({
  block,
  onChange,
}: {
  block: VideoBlock;
  onChange: (next: VideoBlock) => void;
}) {
  const { t } = useTranslations();
  const invalid = block.url.trim().length > 0 && !videoEmbedUrl(block.url);

  return (
    <>
      <input
        className={`auth-field${invalid ? " !border-[var(--stamp)]" : ""}`}
        type="url"
        inputMode="url"
        autoComplete="url"
        autoFocus
        placeholder={t(
          "studio.blocks.field.video_url_ph",
          "https://youtube.com/…, vimeo.com/… vai tiktok.com/…",
        )}
        value={block.url}
        aria-invalid={invalid}
        onChange={(event) => onChange({ ...block, url: event.target.value })}
      />
      {invalid ? (
        <p className="mt-1.5 text-xs text-[var(--stamp)]" role="alert">
          {t(
            "studio.blocks.field.video_invalid",
            "Ievadi derīgu YouTube, Vimeo vai TikTok saiti.",
          )}
        </p>
      ) : null}
    </>
  );
}

function MapsUrlInput({
  block,
  onChange,
}: {
  block: MapsBlock;
  onChange: (next: MapsBlock) => void;
}) {
  const { t } = useTranslations();
  const [resolving, setResolving] = useState(false);
  const resolveGenerationRef = useRef(0);
  const blockRef = useRef(block);
  blockRef.current = block;
  const accepted = mapsBlockUrlAccepted(block.url, block.embedSrc);
  const invalid = block.url.trim().length > 0 && !accepted && !resolving;

  function resolveShortLink() {
    const current = blockRef.current;
    const raw = current.url.trim();
    if (!raw || googleMapsEmbedUrl(raw) || current.embedSrc?.trim()) return;
    if (!isGoogleMapsShortLink(raw)) return;
    const generation = ++resolveGenerationRef.current;
    setResolving(true);
    void fetch(`/api/maps/embed?url=${encodeURIComponent(raw)}`)
      .then((response) => response.json())
      .then((data: { success?: boolean; embedUrl?: string; canonicalUrl?: string }) => {
        if (generation !== resolveGenerationRef.current) return;
        if (!data.success || !data.embedUrl) return;
        const latest = blockRef.current;
        onChange({
          ...latest,
          url: data.canonicalUrl?.trim() || latest.url,
          embedSrc: data.embedUrl,
        });
      })
      .finally(() => {
        if (generation === resolveGenerationRef.current) setResolving(false);
      });
  }

  useEffect(() => {
    const raw = block.url.trim();
    if (!raw || block.embedSrc?.trim() || googleMapsEmbedUrl(raw)) return;
    if (!isGoogleMapsShortLink(raw)) return;
    const timer = window.setTimeout(() => resolveShortLink(), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve when pasted short link stabilizes
  }, [block.url, block.embedSrc]);

  return (
    <>
      <input
        className={`auth-field${invalid ? " !border-[var(--stamp)]" : ""}`}
        type="text"
        inputMode="url"
        autoComplete="url"
        autoFocus
        placeholder={t("studio.blocks.field.maps_url_ph", "https://maps.app.goo.gl/…")}
        value={block.url}
        aria-invalid={invalid}
        onChange={(event) => onChange({ ...block, url: event.target.value, embedSrc: undefined })}
        onBlur={() => resolveShortLink()}
      />
      <p className="mt-1.5 text-xs leading-snug text-[var(--muted)]">
        {t(
          "studio.blocks.field.maps_embed_hint",
          "Vari arī ielīmēt pilnu iegulšanas kodu no Google Maps (Kopīgot → Iegult karti), ieskaitot visu `<iframe>` fragmentu.",
        )}
      </p>
      {resolving ? (
        <p className="mt-1.5 text-xs text-[var(--muted)]">{t("studio.blocks.field.maps_resolving", "Pārbaudu karti…")}</p>
      ) : null}
      {invalid ? (
        <p className="mt-1.5 text-xs text-[var(--stamp)]" role="alert">
          {t(
            "studio.blocks.field.maps_invalid",
            "Ievadi Google Maps saiti vai iegulto (embed) saiti no Kopīgot.",
          )}
        </p>
      ) : null}
    </>
  );
}

function LinkUrlInput({
  block,
  onChange,
}: {
  block: LinkBlock;
  onChange: (next: LinkBlock) => void;
}) {
  const { t } = useTranslations();
  const invalid = block.url.trim().length > 0 && !isValidLinkUrl(block.url);

  return (
    <>
      <input
        className={`auth-field${invalid ? " !border-[var(--stamp)]" : ""}`}
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://"
        value={block.url}
        aria-invalid={invalid}
        onChange={(event) => onChange({ ...block, url: event.target.value })}
        onBlur={() => {
          const normalized = normalizeLinkUrl(block.url);
          if (normalized && normalized !== block.url) {
            onChange({ ...block, url: normalized });
          }
        }}
      />
      {invalid ? (
        <p className="mt-1.5 text-xs text-[var(--stamp)]" role="alert">
          {t("studio.blocks.field.link_invalid", "Ievadi derīgu saiti (https://…).")}
        </p>
      ) : null}
    </>
  );
}

function InstagramFields({
  block,
  onChange,
}: {
  block: InstagramBlock;
  onChange: (next: InstagramBlock) => void;
}) {
  const { t } = useTranslations();
  return (
    <FieldFrame label={t("studio.blocks.instagram.post_url", "Ieraksta saite")}>
      <input
        className="auth-field"
        autoFocus
        placeholder={t("studio.blocks.instagram.post_url_ph", "https://www.instagram.com/p/…")}
        value={block.postUrl ?? ""}
        onChange={(e) => onChange({ ...block, mode: "post", postUrl: e.target.value })}
      />
    </FieldFrame>
  );
}

function XFields({
  block,
  onChange,
}: {
  block: XBlock;
  onChange: (next: XBlock) => void;
}) {
  const { t } = useTranslations();
  return (
    <>
      <FieldFrame label={t("studio.blocks.x.embed", "Ieraksta saite vai iegulums")}>
        <textarea
          className="auth-area min-h-[8rem]"
          autoFocus
          placeholder={t("studio.blocks.x.embed_ph", "https://x.com/vards/status/…")}
          value={block.source}
          onChange={(e) => onChange({ ...block, mode: "post", source: e.target.value })}
        />
      </FieldFrame>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {t("studio.blocks.x.embed_hint", "Vari ielīmēt ieraksta saiti vai X ieguluma kodu. Rādās pats ieraksts.")}
      </p>
    </>
  );
}

function PollOptionsEditor({
  block,
  onChange,
}: {
  block: PollBlock;
  onChange: (next: PollBlock) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const itemIds = block.options.map((item) => item.id);
  const editing = block.options.find((item) => item.id === editId) ?? null;

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function patchOption(id: string, patch: Partial<PollOption>) {
    onChange({
      ...block,
      options: block.options.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addOption() {
    const next = emptyPollOption();
    onChange({ ...block, options: [...block.options, next] });
    setEditId(next.id);
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("studio.blocks.poll.options", "Atbilžu varianti")}</p>
        <button type="button" className="btn-line gap-1 px-2.5 py-1.5 text-[0.64rem] leading-none" onClick={addOption}>
          <span aria-hidden="true">+</span>
          {t("actions.add", "Pievienot")}
        </button>
      </div>

      {block.options.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t("studio.blocks.poll.empty", "Pievieno vismaz divus variantus.")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {block.options.map((item) => {
            const dragging = dragId === item.id;
            const incomplete = !item.label.trim();
            const showLine = Boolean(dragId && drop && drop.id === item.id && dropWouldMove(itemIds, dragId, drop));
            const title = item.label.trim() || t("studio.blocks.poll.new_option", "Jauns variants");
            return (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === item.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: item.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === item.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(block.options, fromId, target);
                    if (next) onChange({ ...block, options: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDragId(item.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <span className="block truncate text-sm font-semibold">{title}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.edit", "Labot")}
                    title={t("actions.edit", "Labot")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    disabled={block.options.length <= 2}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)] disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onChange({ ...block, options: block.options.filter((entry) => entry.id !== item.id) })}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SideDrawer
          title={t("studio.blocks.poll.option_title", "Variants")}
          hint={t("studio.blocks.poll.option_hint", "Atbildes teksts")}
          ariaLabel={t("studio.blocks.poll.edit_option", "Labot variantu")}
          nested
          onClose={() => setEditId(null)}
          footer={(close) => (
            <button type="button" className="btn-ink w-full" onClick={close}>
              {t("common.done", "Gatavs")}
            </button>
          )}
        >
          <FieldFrame label={t("studio.blocks.poll.option_label", "Teksts")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("studio.blocks.poll.option_ph", "Atbildes variants")}
              value={editing.label}
              maxLength={120}
              onChange={(e) => patchOption(editing.id, { label: e.target.value })}
            />
          </FieldFrame>
        </SideDrawer>
      ) : null}
    </>
  );
}

function CountdownTimingFields({
  block,
  onChange,
}: {
  block: CountdownBlock;
  onChange: (next: CountdownBlock) => void;
}) {
  const { t } = useTranslations();
  const { date, time } = countdownDateTimeParts(block.endsAt);

  return (
    <>
      <p className="mb-2 text-sm font-medium">{t("studio.blocks.countdown.when_ends", "Kad beidzas")}</p>
    <div className="mb-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
          block.endMode === "datetime"
            ? "border-[var(--accent)] bg-[var(--paper)] text-[var(--ink)]"
            : "border-[var(--line)] text-[var(--muted)]"
        }`}
        onClick={() => onChange({ ...block, endMode: "datetime" })}
      >
        {t("studio.blocks.countdown.mode.datetime", "Datums un laiks")}
      </button>
      <button
        type="button"
        className={`rounded-lg border px-3 py-2 text-sm font-medium ${
          block.endMode === "duration"
            ? "border-[var(--accent)] bg-[var(--paper)] text-[var(--ink)]"
            : "border-[var(--line)] text-[var(--muted)]"
        }`}
        onClick={() =>
          onChange({
            ...block,
            endMode: "duration",
            startsAt: block.startsAt ?? new Date().toISOString(),
          })
        }
      >
        {t("studio.blocks.countdown.mode.duration", "Ilgums")}
      </button>
    </div>
    {block.endMode === "datetime" ? (
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldFrame label={t("studio.blocks.countdown.end_date", "Datums")}>
          <input
            className="auth-field"
            type="date"
            value={date}
            onChange={(e) => {
              const endsAt = countdownCombineDateTime(e.target.value, time);
              onChange({ ...block, endsAt });
            }}
          />
        </FieldFrame>
        <FieldFrame label={t("studio.blocks.countdown.end_time", "Laiks")}>
          <input
            className="auth-field"
            type="time"
            value={time}
            onChange={(e) => {
              const endsAt = countdownCombineDateTime(date, e.target.value);
              onChange({ ...block, endsAt });
            }}
          />
        </FieldFrame>
      </div>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldFrame label={t("studio.blocks.countdown.hours", "Stundas")}>
          <input
            className="auth-field"
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            value={block.durationHours ?? 0}
            onChange={(e) => {
              const next = clampCountdownDuration(Number(e.target.value), block.durationMinutes ?? 0);
              onChange({
                ...block,
                durationHours: next.hours,
                durationMinutes: next.minutes,
                startsAt: new Date().toISOString(),
              });
            }}
          />
        </FieldFrame>
        <FieldFrame label={t("studio.blocks.countdown.minutes", "Minūtes")}>
          <input
            className="auth-field"
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            value={block.durationMinutes ?? 0}
            onChange={(e) => {
              const next = clampCountdownDuration(block.durationHours ?? 0, Number(e.target.value));
              onChange({
                ...block,
                durationHours: next.hours,
                durationMinutes: next.minutes,
                startsAt: new Date().toISOString(),
              });
            }}
          />
        </FieldFrame>
      </div>
    )}
    </>
  );
}

function SkillsItemsEditor({
  block,
  onChange,
}: {
  block: SkillsBlock;
  onChange: (next: SkillsBlock) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const itemIds = block.items.map((item) => item.id);
  const editing = block.items.find((item) => item.id === editId) ?? null;

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function patchItem(id: string, patch: Partial<SkillItem>) {
    const nextPatch = { ...patch };
    if (typeof nextPatch.rating === "number") {
      nextPatch.rating = clampSkillRating(nextPatch.rating);
    }
    onChange({
      ...block,
      items: block.items.map((item) => (item.id === id ? { ...item, ...nextPatch } : item)),
    });
  }

  function addItem() {
    const next = emptySkillItem();
    onChange({ ...block, items: [...block.items, next] });
    setEditId(next.id);
  }

  return (
    <>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("studio.blocks.skills.list", "Prasmes")}</p>
        <button type="button" className="btn-line gap-1 px-2.5 py-1.5 text-[0.64rem] leading-none" onClick={addItem}>
          <span aria-hidden="true">+</span>
          {t("actions.add", "Pievienot")}
        </button>
      </div>

      {block.items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t("studio.blocks.skills.empty", "Pievieno prasmes. Secību maini ar vilkšanu.")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {block.items.map((item) => {
            const dragging = dragId === item.id;
            const incomplete = !item.name.trim();
            const showLine = Boolean(dragId && drop && drop.id === item.id && dropWouldMove(itemIds, dragId, drop));
            const title = item.name.trim() || t("studio.blocks.skills.new_skill", "Jauna prasme");
            const hint = t("studio.blocks.skills.rating_summary", "{count} no 5", {
              count: clampSkillRating(item.rating),
            });
            return (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === item.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: item.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === item.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(block.items, fromId, target);
                    if (next) onChange({ ...block, items: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDragId(item.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{hint}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.edit", "Labot")}
                    title={t("actions.edit", "Labot")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                    onClick={() => onChange({ ...block, items: block.items.filter((entry) => entry.id !== item.id) })}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SideDrawer
          title={t("studio.blocks.skills.edit_title", "Prasme")}
          hint={t("studio.blocks.skills.edit_hint", "Nosaukums un vērtējums ar zvaigznēm")}
          ariaLabel={t("studio.blocks.skills.edit_aria", "Labot prasmi")}
          nested
          onClose={() => setEditId(null)}
          footer={(close) => (
            <button type="button" className="btn-ink w-full" onClick={close}>
              {t("common.done", "Gatavs")}
            </button>
          )}
        >
          <FieldFrame label={t("common.name", "Nosaukums")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("studio.blocks.skills.name_ph", "Piem. React, Excel, Valodu prasme")}
              value={editing.name}
              maxLength={80}
              onChange={(e) => patchItem(editing.id, { name: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("studio.blocks.skills.field.rating", "Vērtējums")}>
            <SkillRatingPicker
              value={editing.rating}
              onChange={(rating) => patchItem(editing.id, { rating })}
            />
          </FieldFrame>
        </SideDrawer>
      ) : null}
    </>
  );
}

function SkillRatingPicker({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const { t } = useTranslations();
  const rating = clampSkillRating(value);
  return (
    <div
      role="radiogroup"
      aria-label={t("studio.blocks.skills.field.rating", "Vērtējums")}
      className="flex flex-wrap items-center gap-1"
    >
      <button
        type="button"
        role="radio"
        aria-checked={rating === 0}
        aria-label={t("studio.blocks.skills.rating_zero", "0 no 5")}
        onClick={() => onChange(0)}
        className={`min-w-9 rounded-lg border px-2 py-2 text-sm font-medium ${
          rating === 0 ? "border-[var(--accent)] bg-[var(--paper)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--muted)]"
        }`}
      >
        0
      </button>
      {([1, 2, 3, 4, 5] as const).map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={t("feedback.rating.star", "{count} no 5", { count: star })}
          onClick={() => onChange(star)}
          className={`grid size-9 place-items-center rounded-lg hover:bg-[var(--paper)] ${
            rating >= star ? "text-amber-500" : "text-[var(--muted)]"
          }`}
        >
          <SkillStarIcon filled={rating >= star} />
        </button>
      ))}
    </div>
  );
}

function SkillStarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.2l2.4 5.6 6.1.6-4.6 4 1.4 6-5.3-3.2L6.7 19.4l1.4-6-4.6-4 6.1-.6L12 3.2z" />
    </svg>
  );
}

function GalleryLayoutSwitch({
  value,
  onChange,
}: {
  value: GalleryLayout;
  onChange: (layout: GalleryLayout) => void;
}) {
  const { t } = useTranslations();
  const options: { id: GalleryLayout; label: string }[] = [
    { id: "grid", label: t("studio.blocks.gallery.layout.grid", "Režģis") },
    { id: "masonry", label: t("studio.blocks.gallery.layout.masonry", "Masonry") },
    { id: "carousel", label: t("studio.blocks.gallery.layout.carousel", "Karuselis") },
  ];
  return (
    <div className="grid grid-cols-3 rounded-2xl bg-[#e8eef5] p-1" role="radiogroup" aria-label={t("studio.blocks.gallery.layout", "Veids")}>
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={`h-10 rounded-xl px-2 text-sm font-medium ${
              selected ? "bg-white text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[#8b95a3]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function GalleryItemsEditor({
  block,
  onChange,
}: {
  block: GalleryBlock;
  onChange: (next: GalleryBlock) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<Record<string, number>>({});
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  const blockRef = useRef(block);
  const previewsRef = useRef<Record<string, string>>({});
  const seenBlockRef = useRef(block);
  dragIdRef.current = dragId;
  dropRef.current = drop;
  if (block !== seenBlockRef.current) {
    seenBlockRef.current = block;
    blockRef.current = block;
  }

  useEffect(() => {
    const urls = previewsRef.current;
    return () => {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    };
  }, []);

  const itemIds = block.items.map((item) => item.id);
  const editing = block.items.find((item) => item.id === editId) ?? null;

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function patchItem(id: string, patch: Partial<GalleryItem>) {
    const current = blockRef.current;
    const next = {
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    };
    blockRef.current = next;
    onChange(next);
  }

  function clearPreview(id: string) {
    const url = previewsRef.current[id];
    if (!url) return;
    URL.revokeObjectURL(url);
    delete previewsRef.current[id];
  }

  function finishUpload(id: string) {
    clearPreview(id);
    setUploadPercent((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function trackUpload(id: string, file: File, onFail: (message: string) => void) {
    clearPreview(id);
    previewsRef.current[id] = URL.createObjectURL(file);
    setUploadPercent((current) => ({ ...current, [id]: 0 }));
    void readImageFile(
      file,
      (imageUrl) => {
        patchItem(id, { imageUrl });
        finishUpload(id);
      },
      (message) => {
        finishUpload(id);
        onFail(message);
      },
      (percent) => setUploadPercent((current) => ({ ...current, [id]: percent })),
    );
  }

  function addFromFiles(files: File[]) {
    const room = 30 - blockRef.current.items.length;
    const accepted = files.slice(0, room);
    if (accepted.length === 0) return;
    const created = accepted.map(() => emptyGalleryItem());
    const next = { ...blockRef.current, items: [...blockRef.current.items, ...created] };
    blockRef.current = next;
    onChange(next);
    setImageError(null);
    accepted.forEach((file, index) => {
      const id = created[index].id;
      trackUpload(id, file, (message) => {
        setImageError(message);
        const current = blockRef.current;
        const without = { ...current, items: current.items.filter((item) => item.id !== id) };
        blockRef.current = without;
        onChange(without);
      });
    });
  }

  return (
    <>
      <div className="mt-2">
        <p className="mb-2 text-sm font-medium">{t("studio.blocks.gallery.list", "Attēli")}</p>
        <ImageDropField
          multiple
          title={t("studio.blocks.gallery.list", "Attēli")}
          hint={t("studio.blocks.gallery.drop_hint", "Ievelc attēlus vai izvēlies vairākus failus.")}
          preview={<span className="text-sm text-[var(--muted)]">+</span>}
          onFiles={addFromFiles}
        />
        {imageError ? <p className="mt-2 text-sm text-[var(--stamp)]">{imageError}</p> : null}
      </div>

      {block.items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t("studio.blocks.gallery.empty", "Pievieno attēlus. Secību maini ar vilkšanu.")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {block.items.map((item) => {
            const dragging = dragId === item.id;
            const percent = uploadPercent[item.id];
            const uploading = percent !== undefined;
            const incomplete = !item.imageUrl?.trim() && !uploading;
            const showLine = Boolean(dragId && drop && drop.id === item.id && dropWouldMove(itemIds, dragId, drop));
            const title = uploading
              ? t("studio.blocks.gallery.uploading", "Augšupielāde {percent}%", { percent: String(percent) })
              : item.alt?.trim() || t("studio.blocks.gallery.new_image", "Jauns attēls");
            const image = item.imageUrl?.trim() || previewsRef.current[item.id] || "";
            return (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === item.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: item.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === item.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(block.items, fromId, target);
                    if (next) onChange({ ...block, items: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDragId(item.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => {
                      setImageError(null);
                      setEditId(item.id);
                    }}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="size-8 shrink-0 rounded-md object-cover" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold tabular-nums">{title}</span>
                      {uploading ? (
                        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#e8eef5]">
                          <span className="block h-full bg-[var(--accent)]" style={{ width: `${percent}%` }} />
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                    onClick={() => {
                      finishUpload(item.id);
                      const current = blockRef.current;
                      const next = { ...current, items: current.items.filter((entry) => entry.id !== item.id) };
                      blockRef.current = next;
                      onChange(next);
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SideDrawer
          title={t("studio.blocks.gallery.edit_title", "Attēls")}
          hint={t("studio.blocks.gallery.edit_hint", "Attēls un alternatīvais teksts")}
          ariaLabel={t("studio.blocks.gallery.edit_aria", "Labot attēlu")}
          nested
          onClose={() => setEditId(null)}
          footer={(close) => (
            <button type="button" className="btn-ink w-full" onClick={close}>
              {t("common.done", "Gatavs")}
            </button>
          )}
        >
          <FieldFrame label={t("studio.blocks.gallery.alt", "Alternatīvais teksts")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("common.optional", "Nav obligāts")}
              value={editing.alt ?? ""}
              maxLength={120}
              onChange={(event) => patchItem(editing.id, { alt: event.target.value })}
            />
          </FieldFrame>
          <div className="mt-4">
            <ImageDropField
              title={t("onboarding.image.title", "Attēls")}
              hint={t("studio.blocks.field.image_drop_hint", "Ievelc vai izvēlies failu.")}
              preview={
                editing.imageUrl || previewsRef.current[editing.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.imageUrl || previewsRef.current[editing.id]} alt="" className="size-16 rounded-lg object-cover" />
                ) : (
                  <span className="text-sm text-[var(--muted)]">{t("studio.blocks.field.no_image", "Nav attēla")}</span>
                )
              }
              onFile={(file) => {
                if (!file) return;
                setImageError(null);
                trackUpload(editing.id, file, setImageError);
              }}
            />
            {uploadPercent[editing.id] !== undefined ? (
              <p className="mt-2 text-sm tabular-nums text-[var(--muted)]">
                {t("studio.blocks.gallery.uploading", "Augšupielāde {percent}%", {
                  percent: String(uploadPercent[editing.id]),
                })}
              </p>
            ) : null}
            {imageError ? <p className="mt-2 text-sm text-[var(--stamp)]">{imageError}</p> : null}
          </div>
        </SideDrawer>
      ) : null}
    </>
  );
}

function PriceFields({
  price,
  currency,
  onPrice,
  onCurrency,
}: {
  price: string;
  currency: string;
  onPrice: (price: string) => void;
  onCurrency: (currency: string) => void;
}) {
  const { t } = useTranslations();
  return (
    <FieldFrame label={t("studio.blocks.services.price", "Cena")}>
      <div className="flex gap-2">
        <input
          className="auth-field min-w-0 flex-1"
          inputMode="decimal"
          placeholder={t("studio.blocks.services.price_ph", "Piem. 25")}
          value={price}
          maxLength={40}
          onChange={(event) => onPrice(event.target.value)}
        />
        <div className="w-[8.75rem] shrink-0">
          <select
            className="auth-field"
            aria-label={t("studio.blocks.services.currency", "Valūta")}
            value={currency}
            onChange={(event) => onCurrency(event.target.value)}
          >
            <option value="">{t("studio.blocks.services.currency_none", "Bez valūtas")}</option>
            {PRICE_CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.symbol} {item.code}
              </option>
            ))}
          </select>
        </div>
      </div>
    </FieldFrame>
  );
}

function ServicesItemsEditor({
  block,
  onChange,
}: {
  block: ServicesBlock;
  onChange: (next: ServicesBlock) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const itemIds = block.items.map((item) => item.id);
  const editing = block.items.find((item) => item.id === editId) ?? null;

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function patchItem(id: string, patch: Partial<ServiceItem>) {
    onChange({
      ...block,
      items: block.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addItem() {
    const next = emptyServiceItem();
    onChange({ ...block, items: [...block.items, next] });
    setEditId(next.id);
  }

  return (
    <>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("studio.blocks.services.list", "Pakalpojumi")}</p>
        <button type="button" className="btn-line gap-1 px-2.5 py-1.5 text-[0.64rem] leading-none" onClick={addItem}>
          <span aria-hidden="true">+</span>
          {t("actions.add", "Pievienot")}
        </button>
      </div>

      {block.items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t("studio.blocks.services.empty", "Pievieno pakalpojumus. Secību maini ar vilkšanu.")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {block.items.map((item) => {
            const dragging = dragId === item.id;
            const incomplete = !item.name.trim();
            const showLine = Boolean(dragId && drop && drop.id === item.id && dropWouldMove(itemIds, dragId, drop));
            const title = item.name.trim() || t("studio.blocks.services.new_service", "Jauns pakalpojums");
            const price = formatItemPrice(item.price, item.currency);
            const description = item.description?.trim() ?? "";
            const hint = [description, price].filter(Boolean).join(" · ");
            return (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === item.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: item.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === item.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(block.items, fromId, target);
                    if (next) onChange({ ...block, items: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDragId(item.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{title}</span>
                      {hint ? <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{hint}</span> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.edit", "Labot")}
                    title={t("actions.edit", "Labot")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                    onClick={() => onChange({ ...block, items: block.items.filter((entry) => entry.id !== item.id) })}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SideDrawer
          title={t("studio.blocks.services.edit_title", "Pakalpojums")}
          hint={t("studio.blocks.services.edit_hint", "Nosaukums, apraksts un cena")}
          ariaLabel={t("studio.blocks.services.edit_aria", "Labot pakalpojumu")}
          nested
          onClose={() => setEditId(null)}
          footer={(close) => (
            <button type="button" className="btn-ink w-full" onClick={close}>
              {t("common.done", "Gatavs")}
            </button>
          )}
        >
          <FieldFrame label={t("common.title", "Nosaukums")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("studio.blocks.services.name_ph", "Piem. Konsultācija, Griezums")}
              value={editing.name}
              maxLength={80}
              onChange={(e) => patchItem(editing.id, { name: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("common.description", "Apraksts")}>
            <textarea
              className="auth-area min-h-[4.5rem]"
              placeholder={t("common.optional", "Nav obligāts")}
              value={editing.description ?? ""}
              maxLength={240}
              onChange={(e) => patchItem(editing.id, { description: e.target.value })}
            />
          </FieldFrame>
          <PriceFields
            price={editing.price ?? ""}
            currency={editing.currency ?? ""}
            onPrice={(price) => patchItem(editing.id, { price })}
            onCurrency={(currency) => patchItem(editing.id, { currency })}
          />
        </SideDrawer>
      ) : null}
    </>
  );
}

function ProductsItemsEditor({
  block,
  onChange,
}: {
  block: ProductsBlock;
  onChange: (next: ProductsBlock) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  const blockRef = useRef(block);
  dragIdRef.current = dragId;
  dropRef.current = drop;
  blockRef.current = block;

  const itemIds = block.items.map((item) => item.id);
  const editing = block.items.find((item) => item.id === editId) ?? null;

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function patchItem(id: string, patch: Partial<ProductItem>) {
    const current = blockRef.current;
    onChange({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addItem() {
    const next = emptyProductItem();
    onChange({ ...block, items: [...block.items, next] });
    setImageError(null);
    setEditId(next.id);
  }

  return (
    <>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("studio.blocks.products.list", "Produkti")}</p>
        <button type="button" className="btn-line gap-1 px-2.5 py-1.5 text-[0.64rem] leading-none" onClick={addItem}>
          <span aria-hidden="true">+</span>
          {t("actions.add", "Pievienot")}
        </button>
      </div>

      {block.items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t("studio.blocks.products.empty", "Pievieno produktus. Secību maini ar vilkšanu.")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {block.items.map((item) => {
            const dragging = dragId === item.id;
            const incomplete = !item.name.trim();
            const showLine = Boolean(dragId && drop && drop.id === item.id && dropWouldMove(itemIds, dragId, drop));
            const title = item.name.trim() || t("studio.blocks.products.new_product", "Jauns produkts");
            const price = formatItemPrice(item.price, item.currency);
            const description = item.description?.trim() ?? "";
            const hint = [description, price].filter(Boolean).join(" · ");
            const image = item.imageUrl?.trim() ?? "";
            return (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === item.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: item.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === item.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(block.items, fromId, target);
                    if (next) onChange({ ...block, items: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDragId(item.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => {
                      setImageError(null);
                      setEditId(item.id);
                    }}
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="size-8 shrink-0 rounded-md object-cover" />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{title}</span>
                      {hint ? <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{hint}</span> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.edit", "Labot")}
                    title={t("actions.edit", "Labot")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    onClick={() => {
                      setImageError(null);
                      setEditId(item.id);
                    }}
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                    onClick={() => onChange({ ...block, items: block.items.filter((entry) => entry.id !== item.id) })}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SideDrawer
          title={t("studio.blocks.products.edit_title", "Produkts")}
          hint={t("studio.blocks.products.edit_hint", "Nosaukums, apraksts, attēls un cena")}
          ariaLabel={t("studio.blocks.products.edit_aria", "Labot produktu")}
          nested
          onClose={() => setEditId(null)}
          footer={(close) => (
            <button type="button" className="btn-ink w-full" onClick={close}>
              {t("common.done", "Gatavs")}
            </button>
          )}
        >
          <FieldFrame label={t("common.title", "Nosaukums")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("studio.blocks.products.name_ph", "Piem. T-krekls, Kafija")}
              value={editing.name}
              maxLength={80}
              onChange={(e) => patchItem(editing.id, { name: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("common.description", "Apraksts")}>
            <textarea
              className="auth-area min-h-[4.5rem]"
              placeholder={t("common.optional", "Nav obligāts")}
              value={editing.description ?? ""}
              maxLength={240}
              onChange={(e) => patchItem(editing.id, { description: e.target.value })}
            />
          </FieldFrame>
          <div className="mt-3">
            <ImageDropField
              title={t("onboarding.image.title", "Attēls")}
              hint={t("studio.blocks.field.image_drop_hint", "Ievelc vai izvēlies failu.")}
              preview={
                editing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.imageUrl} alt="" className="size-16 rounded-lg object-cover" />
                ) : (
                  <span className="text-sm text-[var(--muted)]">{t("studio.blocks.field.no_image", "Nav attēla")}</span>
                )
              }
              onFile={(file) => {
                setImageError(null);
                void readImageFile(
                  file,
                  (imageUrl) => patchItem(editing.id, { imageUrl }),
                  (message) => setImageError(message),
                );
              }}
            />
            {editing.imageUrl ? (
              <button
                type="button"
                className="btn-line mt-2 w-full"
                onClick={() => patchItem(editing.id, { imageUrl: null })}
              >
                {t("studio.blocks.remove_image", "Noņemt attēlu")}
              </button>
            ) : null}
            {imageError ? <p className="mt-2 text-sm text-[var(--stamp)]">{imageError}</p> : null}
          </div>
          <PriceFields
            price={editing.price ?? ""}
            currency={editing.currency ?? ""}
            onPrice={(price) => patchItem(editing.id, { price })}
            onCurrency={(currency) => patchItem(editing.id, { currency })}
          />
        </SideDrawer>
      ) : null}
    </>
  );
}

function FaqItemsEditor({
  block,
  onChange,
}: {
  block: FaqBlock;
  onChange: (next: FaqBlock) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const itemIds = block.items.map((item) => item.id);
  const editing = block.items.find((item) => item.id === editId) ?? null;

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function patchItem(id: string, patch: Partial<FaqBlockItem>) {
    onChange({
      ...block,
      items: block.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addItem() {
    const next = emptyFaqItem();
    onChange({ ...block, items: [...block.items, next] });
    setEditId(next.id);
  }

  return (
    <>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("studio.blocks.faq.questions", "Jautājumi")}</p>
        <button type="button" className="btn-line gap-1 px-2.5 py-1.5 text-[0.64rem] leading-none" onClick={addItem}>
          <span aria-hidden="true">+</span>
          {t("actions.add", "Pievienot")}
        </button>
      </div>

      {block.items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{t("studio.blocks.faq.empty", "Pievieno jautājumus. Secību maini ar vilkšanu.")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {block.items.map((item) => {
            const dragging = dragId === item.id;
            const incomplete = !item.question.trim();
            const showLine = Boolean(dragId && drop && drop.id === item.id && dropWouldMove(itemIds, dragId, drop));
            const title = item.question.trim() || t("studio.blocks.faq.new_question", "Jauns jautājums");
            const hint = item.answer.trim() || t("studio.blocks.faq.no_answer", "Nav atbildes");
            return (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === item.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: item.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === item.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(block.items, fromId, target);
                    if (next) onChange({ ...block, items: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDragId(item.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{hint}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.edit", "Labot")}
                    title={t("actions.edit", "Labot")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                    onClick={() => onChange({ ...block, items: block.items.filter((entry) => entry.id !== item.id) })}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SideDrawer
          title={t("common.question", "Jautājums")}
          hint={t("studio.blocks.faq.edit_hint", "Jautājums un atbilde")}
          ariaLabel={t("studio.blocks.faq.edit_aria", "Labot jautājumu")}
          nested
          onClose={() => setEditId(null)}
          footer={(close) => (
            <button type="button" className="btn-ink w-full" onClick={close}>
              {t("common.done", "Gatavs")}
            </button>
          )}
        >
          <FieldFrame label={t("common.question", "Jautājums")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("common.question", "Jautājums")}
              value={editing.question}
              maxLength={160}
              onChange={(e) => patchItem(editing.id, { question: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("common.answer", "Atbilde")}>
            <textarea
              className="auth-area min-h-[5rem]"
              placeholder={t("common.answer", "Atbilde")}
              value={editing.answer}
              onChange={(e) => patchItem(editing.id, { answer: e.target.value })}
            />
          </FieldFrame>
        </SideDrawer>
      ) : null}
    </>
  );
}

function ResumeItemsEditor({
  block,
  onChange,
}: {
  block: ResumeBlock;
  onChange: (next: ResumeBlock) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const itemIds = block.items.map((item) => item.id);
  const editing = block.items.find((item) => item.id === editId) ?? null;

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function patchItem(id: string, patch: Partial<ResumeItem>) {
    onChange({
      ...block,
      items: block.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function addItem() {
    const next = emptyResumeItem();
    onChange({ ...block, items: [...block.items, next] });
    setEditId(next.id);
  }

  return (
    <>
      <FieldFrame label={t("common.heading", "Virsraksts")}>
        <input
          className="auth-field"
          placeholder={t("studio.blocks.resume.heading_ph", "Piem. Pieredze")}
          value={block.heading ?? ""}
          maxLength={80}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
        />
      </FieldFrame>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t("studio.blocks.resume.entries", "Ieraksti")}</p>
        <button type="button" className="btn-line gap-1 px-2.5 py-1.5 text-[0.64rem] leading-none" onClick={addItem}>
          <span aria-hidden="true">+</span>
          {t("actions.add", "Pievienot")}
        </button>
      </div>

      {block.items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{t("studio.blocks.resume.empty", "Pievieno ierakstus. Secību maini ar vilkšanu.")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {block.items.map((item) => {
            const dragging = dragId === item.id;
            const incomplete = !item.date.trim() || !item.title.trim();
            const showLine = Boolean(dragId && drop && drop.id === item.id && dropWouldMove(itemIds, dragId, drop));
            const title = item.title.trim() || t("studio.blocks.resume.new_entry", "Jauns ieraksts");
            const hint = item.date.trim() || item.description.trim() || t("studio.blocks.resume.not_filled", "Nav aizpildīts");
            return (
              <li
                key={item.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === item.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: item.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node) && drop?.id === item.id) {
                    setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(block.items, fromId, target);
                    if (next) onChange({ ...block, items: next });
                  }
                  clearDrag();
                }}
                className={`relative rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : incomplete
                      ? "border-2 border-solid border-[var(--stamp)] opacity-100"
                      : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    draggable
                    aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                    title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                    className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                      setDragId(item.id);
                      setDrop(null);
                    }}
                    onDragEnd={clearDrag}
                  >
                    <DragHandle />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-[var(--paper)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{title}</span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{hint}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.edit", "Labot")}
                    title={t("actions.edit", "Labot")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                    onClick={() => setEditId(item.id)}
                  >
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    aria-label={t("actions.delete", "Dzēst")}
                    title={t("actions.delete", "Dzēst")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                    onClick={() => onChange({ ...block, items: block.items.filter((entry) => entry.id !== item.id) })}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <SideDrawer
          title={t("studio.blocks.resume.entry", "Ieraksts")}
          hint={t("studio.blocks.resume.edit_hint", "Datums, nosaukums un apraksts")}
          ariaLabel={t("studio.blocks.resume.edit_aria", "Labot ierakstu")}
          nested
          onClose={() => setEditId(null)}
          footer={(close) => (
            <button type="button" className="btn-ink w-full" onClick={close}>
              {t("common.done", "Gatavs")}
            </button>
          )}
        >
          <FieldFrame label={t("studio.blocks.resume.date", "Gads / datums")}>
            <input
              className="auth-field"
              autoFocus
              placeholder={t("studio.blocks.resume.date_ph", "2024 vai 2020–2024")}
              value={editing.date}
              maxLength={40}
              onChange={(e) => patchItem(editing.id, { date: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("common.title", "Nosaukums")}>
            <input
              className="auth-field"
              placeholder={t("studio.blocks.resume.title_ph", "Amats / sasniegums")}
              value={editing.title}
              maxLength={100}
              onChange={(e) => patchItem(editing.id, { title: e.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("common.description", "Apraksts")}>
            <textarea
              className="auth-area min-h-[5rem]"
              placeholder={t("studio.blocks.resume.desc_ph", "Īss apraksts")}
              value={editing.description}
              onChange={(e) => patchItem(editing.id, { description: e.target.value })}
            />
          </FieldFrame>
        </SideDrawer>
      ) : null}
    </>
  );
}

function SideDrawer({
  title,
  hint,
  children,
  footer,
  onClose,
  ariaLabel,
  nested = false,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode | ((close: () => void) => ReactNode);
  onClose: () => void;
  ariaLabel: string;
  nested?: boolean;
}) {
  const { t } = useTranslations();
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function requestClose() {
    if (!closing) setClosing(true);
  }

  const footerNode = typeof footer === "function" ? footer(requestClose) : footer;
  const shellZ = nested ? "z-[90]" : "z-[80]";
  const panelZ = nested ? "z-[91]" : "z-[81]";

  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return;
    const panelAnim = panel.animate(
      closing
        ? [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }]
        : [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }],
      {
        duration: closing ? 240 : 280,
        easing: closing ? "ease-in" : "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    const backdropAnim = backdrop?.animate(
      closing ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }],
      { duration: closing ? 200 : 240, easing: "ease", fill: "forwards" },
    );
    if (closing) panelAnim.onfinish = () => onCloseRef.current();
    return () => {
      panelAnim.cancel();
      backdropAnim?.cancel();
    };
  }, [closing]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || closing) return;
      event.preventDefault();
      if (nested) event.stopImmediatePropagation();
      requestClose();
    }
    window.addEventListener("keydown", onKey, nested);
    return () => window.removeEventListener("keydown", onKey, nested);
  }, [closing, nested]);

  return createPortal(
    <div className={`option-drawer-shell option-drawer-shell--studio ${shellZ}`}>
      <button
        ref={backdropRef}
        type="button"
        aria-label={t("actions.close", "Aizvērt")}
        className="option-drawer-backdrop bg-[var(--ink)]/35"
        style={{ opacity: 0 }}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`option-drawer ${panelZ} border-r border-[var(--line)]`}
        style={{ transform: "translateX(-100%)" }}
      >
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
          </div>
          <button type="button" className="btn-quiet" onClick={requestClose} aria-label={t("actions.close", "Aizvērt")} disabled={closing}>
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footerNode ? <div className="border-t border-[var(--line)] p-3">{footerNode}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

function DragHandle() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="4" r="1.15" />
      <circle cx="11" cy="4" r="1.15" />
      <circle cx="5" cy="8" r="1.15" />
      <circle cx="11" cy="8" r="1.15" />
      <circle cx="5" cy="12" r="1.15" />
      <circle cx="11" cy="12" r="1.15" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4.5 16.5 15.2 5.8a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L7.5 19.5H4.5v-3Z" strokeLinejoin="round" />
      <path d="M13.5 7.5 16.5 10.5" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 7.5h14M10 7.5V5.8h4v1.7M8.5 7.5l.7 11h5.6l.7-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
