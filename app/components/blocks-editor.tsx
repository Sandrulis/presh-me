"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BlockStyleFields } from "@/app/components/block-style-fields";
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
  emptyResumeItem,
  instagramMediaUrlsFromText,
  readImageFile,
} from "@/app/lib/blocks";
import { normalizeLinkUrl, isValidLinkUrl } from "@/app/lib/urls";
import { commitDropReorder, dropWouldMove, edgeFromPointer, type DropTarget } from "@/app/lib/dnd-reorder";
import type {
  BlockType,
  FaqBlock,
  FaqBlockItem,
  InstagramBlock,
  LinkBlock,
  PageBlock,
  Portfolio,
  ResumeBlock,
  ResumeItem,
} from "@/app/lib/types";

export function BlocksEditor({
  page,
  update,
  onPreviewDraft,
}: {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
  onPreviewDraft?: (draft: PageBlock | null) => void;
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

  const onPreviewDraftRef = useRef(onPreviewDraft);
  onPreviewDraftRef.current = onPreviewDraft;
  useEffect(() => {
    onPreviewDraftRef.current?.(creating);
    return () => onPreviewDraftRef.current?.(null);
  }, [creating]);

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
          block={creating}
          mode="create"
          onClose={() => setCreating(null)}
          onChange={setCreating}
          onSave={saveCreating}
        />
      ) : null}

      {editing && !creating ? (
        <BlockEditDrawer
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
  block,
  mode,
  onClose,
  onChange,
  onSave,
}: {
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
      <BlockFields block={block} onChange={onChange} />
    </SideDrawer>
  );
}

function BlockFields({ block, onChange }: { block: PageBlock; onChange: (next: PageBlock) => void }) {
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
    case "youtube":
      return (
        <>
          <FieldFrame label={t("studio.blocks.field.youtube_url", "YouTube saite")}>
            <input className="auth-field" autoFocus placeholder="https://youtube.com/watch?v=…" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} />
          </FieldFrame>
          <FieldFrame label={t("studio.blocks.field.youtube_title", "Virsraksts")}>
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
      return <BookingBlockFields block={block} onChange={onChange} />;
  }
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
  const [linksText, setLinksText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const count = Math.min(12, Math.max(1, block.count || 6));

  function applyPostLinks() {
    const fromLinks = instagramMediaUrlsFromText(linksText, count);
    if (fromLinks.length === 0) {
      setStatus(t("studio.blocks.instagram.paste_error", "Ielīmē Instagram ierakstu saites (instagram.com/p/… vai /reel/…)."));
      return;
    }
    const merged: string[] = [];
    const seen = new Set<string>();
    for (const src of [...fromLinks, ...block.images]) {
      const key = src.match(/\/p\/([A-Za-z0-9_-]+)/)?.[1] ?? src;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(src);
      if (merged.length >= count) break;
    }
    onChange({ ...block, images: merged });
    setLinksText("");
    setStatus(t("studio.blocks.instagram.added_status", "Pievienotas {count} bildes (rāda līdz {max}).", { count: fromLinks.length, max: count }));
  }

  return (
    <>
      <FieldFrame label={t("onboarding.instagram_username", "Instagram lietotājvārds")}>
        <input
          className="auth-field"
          placeholder={t("studio.blocks.instagram.username_ph", "@lietotajs (nav obligāts)")}
          value={block.username}
          maxLength={60}
          onChange={(e) => onChange({ ...block, username: e.target.value })}
        />
      </FieldFrame>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">{t("common.columns", "Kolonnas")}</p>
        <div className="inline-flex rounded-2xl bg-[#e8eef5] p-1">
          {([2, 3, 4] as const).map((cols) => (
            <button
              key={cols}
              type="button"
              className={`h-9 min-w-10 rounded-xl px-3 text-sm font-medium ${block.columns === cols ? "bg-white shadow-[0_1px_2px_rgba(16,24,40,0.12)]" : "text-[#8b95a3]"}`}
              onClick={() => onChange({ ...block, columns: cols })}
            >
              {cols}
            </button>
          ))}
        </div>
      </div>

      <FieldFrame label={t("studio.blocks.instagram.image_count", "Bildžu skaits")}>
        <input
          className="auth-field"
          type="number"
          min={1}
          max={12}
          value={count}
          onChange={(e) => {
            const next = Math.min(12, Math.max(1, Number(e.target.value) || 1));
            onChange({ ...block, count: next, images: block.images.slice(0, next) });
          }}
        />
      </FieldFrame>

      <p className="mt-3 text-xs text-[var(--muted)]">
        {t("studio.blocks.instagram.api_note", "Instagram neatļauj automātiski ņemt „pēdējās N” no profila bez oficiālā API. Ielīmē konkrētu ierakstu saites — rādīsies tikai bildes (bez galvenes), skaitā un kolonnās kā iestatīts.")}
      </p>

      <div className="mt-3">
        <FieldFrame label={t("studio.blocks.instagram.post_links", "Ierakstu saites")}>
          <textarea
            className="auth-area min-h-[7rem]"
            autoFocus
            placeholder={t("studio.blocks.instagram.post_links_ph", "https://www.instagram.com/p/…\nhttps://www.instagram.com/reel/…")}
            value={linksText}
            onChange={(e) => {
              setStatus(null);
              setLinksText(e.target.value);
            }}
          />
        </FieldFrame>
        <button type="button" className="btn-line mt-2 w-full" onClick={applyPostLinks}>
          {t("studio.blocks.instagram.add_from_links", "Pievienot bildes no saitēm")}
        </button>
        {status ? <p className="mt-2 text-xs text-[var(--muted)]">{status}</p> : null}
      </div>

      {block.images.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {block.images.slice(0, count).map((src, index) => (
            <div key={`${src.slice(0, 40)}-${index}`} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <button
                type="button"
                className="text-xs text-[var(--stamp)]"
                onClick={() => onChange({ ...block, images: block.images.filter((_, i) => i !== index) })}
              >
                {t("common.remove", "Noņemt")}
              </button>
            </div>
          ))}
          <button type="button" className="btn-line w-full" onClick={() => onChange({ ...block, images: [] })}>
            {t("studio.blocks.instagram.clear_images", "Notīrīt bildes")}
          </button>
        </div>
      ) : null}

      {block.images.length < count ? (
        <div className="mt-3">
          <ImageDropField
            title={t("studio.blocks.instagram.add_own", "Vai pievienot savu bildi")}
            hint={t("studio.blocks.instagram.remaining", "Vēl {count} līdz limitam.", { count: count - block.images.length })}
            preview={<span className="text-sm text-[var(--muted)]">{t("actions.add", "Pievienot")}</span>}
            onFile={(file) =>
              void readImageFile(
                file,
                (src) => onChange({ ...block, images: [...block.images, src].slice(0, count) }),
                () => {},
              )
            }
          />
        </div>
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
    <div className={`fixed inset-0 ${shellZ}`}>
      <button
        ref={backdropRef}
        type="button"
        aria-label={t("actions.close", "Aizvērt")}
        className="absolute inset-0 bg-[var(--ink)]/35"
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
