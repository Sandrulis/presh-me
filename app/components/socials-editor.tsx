"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DropLine } from "@/app/components/drop-line";
import { FieldFrame } from "@/app/components/field-frame";
import { SocialIcon } from "@/app/components/social-icon";
import { useTranslations } from "@/app/components/translations-provider";
import { commitDropReorder, dropWouldMove, edgeFromPointer, type DropTarget } from "@/app/lib/dnd-reorder";
import { SOCIAL_CATALOG, socialDisplayName, socialMeta } from "@/app/lib/socials";
import type { Portfolio, SocialLink, SocialPlatform } from "@/app/lib/types";

export function SocialsEditor({
  page,
  update,
}: {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const editing = page.socials.find((item) => item.id === editId) ?? null;
  const socialIds = page.socials.map((item) => item.id);

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  function addPlatform(platform: SocialPlatform) {
    const id = crypto.randomUUID();
    update({
      socials: [...page.socials, { id, platform, url: "", label: socialMeta(platform).label }],
    });
    setPickerOpen(false);
    setEditId(id);
  }

  function patch(id: string, patch: Partial<SocialLink>) {
    update({
      socials: page.socials.map((item) => (item.id === id ? { ...item, ...patch } : item)),
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

      {page.socials.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{t("studio.socials.empty", "Pievieno sociālos tīklus. Secību maini ar vilkšanu.")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {page.socials.map((social) => {
            const meta = socialMeta(social.platform);
            const dragging = dragId === social.id;
            const showLine = Boolean(dragId && drop && drop.id === social.id && dropWouldMove(socialIds, dragId, drop));
            return (
              <li
                key={social.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (!dragId || dragId === social.id) {
                    if (drop) setDrop(null);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const next: DropTarget = {
                    id: social.id,
                    edge: edgeFromPointer(event.clientY, rect.top, rect.height),
                  };
                  if (!drop || drop.id !== next.id || drop.edge !== next.edge) setDrop(next);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    if (drop?.id === social.id) setDrop(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                  const target = dropRef.current;
                  if (fromId) {
                    const next = commitDropReorder(page.socials, fromId, target);
                    if (next) update({ socials: next });
                  }
                  clearDrag();
                }}
                className={`relative flex items-center gap-1.5 rounded-xl bg-white px-1.5 py-1.5 transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                  dragging
                    ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35] shadow-none"
                    : "border border-solid border-[var(--line)] opacity-100"
                }`}
              >
                {showLine && drop ? <DropLine edge={drop.edge} /> : null}
                <button
                  type="button"
                  draggable
                  aria-label={t("studio.dnd.change_priority", "Mainīt prioritāti")}
                  title={t("studio.dnd.drag_order", "Velc, lai mainītu secību")}
                  className="grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", social.id);
                    setDragId(social.id);
                    setDrop(null);
                  }}
                  onDragEnd={clearDrag}
                >
                  <DragHandle />
                </button>

                <div className="relative min-w-0 flex-1">
                  <input
                    className="auth-field h-10 !pr-10"
                    value={social.url}
                    placeholder={meta.placeholder}
                    onChange={(event) => patch(social.id, { url: event.target.value })}
                    aria-label={socialDisplayName(social)}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[var(--ink)]">
                    <SocialIcon platform={social.platform} size={16} />
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={t("actions.edit", "Labot")}
                  title={t("actions.edit", "Labot")}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
                  onClick={() => setEditId(social.id)}
                >
                  <IconEdit />
                </button>
                <button
                  type="button"
                  aria-label={t("actions.delete", "Dzēst")}
                  title={t("actions.delete", "Dzēst")}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-[var(--stamp)]"
                  onClick={() => update({ socials: page.socials.filter((item) => item.id !== social.id) })}
                >
                  <IconTrash />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {pickerOpen ? <SocialPickerModal onClose={() => setPickerOpen(false)} onPick={addPlatform} /> : null}
      {editing ? (
        <SocialEditModal
          social={editing}
          onClose={() => setEditId(null)}
          onChange={(next) => patch(editing.id, next)}
        />
      ) : null}
    </>
  );
}

function SocialPickerModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (platform: SocialPlatform) => void;
}) {
  const { t } = useTranslations();
  const [query, setQuery] = useState("");
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const items = useMemo(() => {
    const popular = SOCIAL_CATALOG.filter((item) => item.popular);
    const q = query.trim().toLowerCase();
    if (!q) return popular;
    return popular.filter((item) => item.label.toLowerCase().includes(q) || item.id.includes(q));
  }, [query]);

  function requestClose() {
    if (!closing) setClosing(true);
  }

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
      closing
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [{ opacity: 0 }, { opacity: 1 }],
      { duration: closing ? 200 : 240, easing: "ease", fill: "forwards" },
    );

    if (closing) {
      panelAnim.onfinish = () => onCloseRef.current();
    }

    return () => {
      panelAnim.cancel();
      backdropAnim?.cancel();
    };
  }, [closing]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || closing) return;
      event.preventDefault();
      requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closing]);

  return createPortal(
    <div className="option-drawer-shell option-drawer-shell--studio z-[80]">
      <button
        ref={backdropRef}
        type="button"
        aria-label={t("actions.close", "Aizvērt")}
        className="option-drawer-backdrop bg-[var(--ink)]/35 backdrop-blur-[2px]"
        style={{ opacity: 0 }}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("studio.socials.add_dialog_aria", "Pievienot sociālo tīklu")}
        className="option-drawer z-[81] border-r border-[var(--line)]"
        style={{ transform: "translateX(-100%)" }}
      >
        <div className="border-b border-[var(--line)] p-3">
          <label className="relative block">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]">
              <IconSearch />
            </span>
            <input
              autoFocus
              className="auth-field !h-11 !pl-10"
              placeholder={t("common.search", "Meklēt...")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id)}
                className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-2.5 py-2.5 text-left text-sm hover:border-[var(--accent)] hover:bg-[var(--paper)]"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--paper)] text-[var(--ink)]">
                  <SocialIcon platform={item.id} size={15} />
                </span>
                <span className="min-w-0 truncate font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          {items.length === 0 ? <p className="py-8 text-center text-sm text-[var(--muted)]">{t("common.not_found", "Nekas nav atrasts.")}</p> : null}
        </div>
        <div className="border-t border-[var(--line)] p-3">
          <button type="button" className="btn-ink w-full" onClick={requestClose} disabled={closing}>
            {t("common.done", "Gatavs")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SocialEditModal({
  social,
  onClose,
  onChange,
}: {
  social: SocialLink;
  onClose: () => void;
  onChange: (patch: Partial<SocialLink>) => void;
}) {
  const { t } = useTranslations();
  const meta = socialMeta(social.platform);
  const urlLabel =
    social.platform === "email"
      ? t("common.email", "E-pasts")
      : social.platform === "phone"
        ? t("common.phone", "Telefons")
        : t("common.link", "Saite");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" aria-label={t("actions.close", "Aizvērt")} className="absolute inset-0 bg-[var(--ink)]/35 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("studio.socials.edit_dialog_aria", "Labot sociālo tīklu")}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[var(--paper)] text-[var(--ink)]">
            <SocialIcon platform={social.platform} size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{socialDisplayName(social)}</p>
            <p className="text-xs text-[var(--muted)]">{meta.label}</p>
          </div>
          <button type="button" className="btn-quiet" onClick={onClose} aria-label={t("actions.close", "Aizvērt")}>
            ×
          </button>
        </div>

        <FieldFrame label={t("common.title", "Nosaukums")}>
          <input
            className="auth-field"
            value={social.label ?? meta.label}
            maxLength={40}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </FieldFrame>
        <FieldFrame label={t("common.platform", "Platforma")}>
          <select
            className="auth-field"
            value={social.platform}
            onChange={(event) => {
              const platform = event.target.value as SocialPlatform;
              const nextMeta = socialMeta(platform);
              onChange({
                platform,
                label: social.label?.trim() && social.label !== meta.label ? social.label : nextMeta.label,
              });
            }}
          >
            {SOCIAL_CATALOG.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </FieldFrame>
        <FieldFrame label={urlLabel}>
          <input
            className="auth-field"
            value={social.url}
            placeholder={meta.placeholder}
            onChange={(event) => onChange({ url: event.target.value })}
          />
        </FieldFrame>

        <button type="button" className="btn-ink mt-4 w-full" onClick={onClose}>
          {t("actions.save", "Saglabāt")}
        </button>
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

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.2 16.2 20 20" strokeLinecap="round" />
    </svg>
  );
}
