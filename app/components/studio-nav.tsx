"use client";

import { useRef, useState, type ReactNode } from "react";
import { ToggleSwitch } from "@/app/components/admin-ui";
import { DropLine } from "@/app/components/drop-line";
import { useTranslations } from "@/app/components/translations-provider";
import { commitDropReorder, dropWouldMove, edgeFromPointer, type DropTarget } from "@/app/lib/dnd-reorder";

export type StudioMenuItem = {
  id: string;
  title: string;
  hint?: string;
  icon: ReactNode;
  /** Var vilkt, lai mainītu prioritāti starp citām sortable kartītēm. */
  sortable?: boolean;
  /** Slēdzis Pamatu sarakstā (neatver detaļu skatu). */
  switch?: {
    checked: boolean;
    label: string;
    onChange: (checked: boolean) => void;
  };
};

export function StudioMenu({
  title,
  hint,
  items,
  onOpen,
  onReorder,
}: {
  title: string;
  hint?: string;
  items: StudioMenuItem[];
  onOpen: (id: string) => void;
  /** Saņem jauno pilno id secību pēc drop. */
  onReorder?: (orderedIds: string[]) => void;
}) {
  const { t } = useTranslations();
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropTarget | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const dropRef = useRef<DropTarget | null>(null);
  dragIdRef.current = dragId;
  dropRef.current = drop;

  const sortableIds = items.filter((item) => item.sortable).map((item) => item.id);

  function clearDrag() {
    setDragId(null);
    setDrop(null);
  }

  return (
    <>
      <div>
        <h2 className="font-display text-xl font-bold tracking-[-0.03em]">{title}</h2>
        {hint ? <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{hint}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const dragging = dragId === item.id;
          const sortable = Boolean(item.sortable && onReorder);
          const showLine = Boolean(
            sortable && dragId && drop && drop.id === item.id && dropWouldMove(sortableIds, dragId, drop),
          );
          return (
            <div
              key={item.id}
              onDragOver={(event) => {
                if (!sortable || !dragId || !onReorder) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dragId === item.id) {
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
                if (!onReorder) {
                  clearDrag();
                  return;
                }
                const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
                const target = dropRef.current;
                if (fromId && sortableIds.includes(fromId)) {
                  const sortableItems = sortableIds.map((id) => ({ id }));
                  const nextSortable = commitDropReorder(sortableItems, fromId, target);
                  if (nextSortable) {
                    const nextSortableIds = nextSortable.map((entry) => entry.id);
                    let si = 0;
                    const ordered = items.map((entry) =>
                      entry.sortable ? (nextSortableIds[si++] ?? entry.id) : entry.id,
                    );
                    onReorder(ordered);
                  }
                }
                clearDrag();
              }}
              className={`relative flex items-stretch gap-1 rounded-[10px] transition-[opacity,border-color,box-shadow,border-width] duration-150 ${
                dragging
                  ? "border-2 border-dashed border-[var(--accent)] opacity-[0.35]"
                  : "border border-transparent opacity-100"
              }`}
            >
              {showLine && drop ? <DropLine edge={drop.edge} /> : null}
              {sortable ? (
                <button
                  type="button"
                  draggable
                  aria-label={t("studio.dnd.change_item_priority", "Mainīt {title} prioritāti", { title: item.title })}
                  title={t("studio.dnd.drag_page_order", "Velc, lai mainītu secību lapā")}
                  className="mt-1.5 grid size-8 shrink-0 cursor-grab place-items-center self-start rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] active:cursor-grabbing"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.id);
                    setDragId(item.id);
                    setDrop(null);
                  }}
                  onDragEnd={clearDrag}
                  onClick={(event) => event.stopPropagation()}
                >
                  <DragHandle />
                </button>
              ) : null}
              <div className="choice flex min-w-0 flex-1 items-center gap-2.5 !px-[0.6rem] !py-[0.54rem] !shadow-none">
                <button
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className={`flex min-w-0 flex-1 items-center gap-2.5 text-left ${sortable ? "-ml-1" : ""}`}
                >
                  <span className="grid size-5 shrink-0 place-items-center text-[var(--ink)]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug">{item.title}</span>
                    {item.hint ? <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">{item.hint}</span> : null}
                  </span>
                  {!item.switch ? <Chevron /> : null}
                </button>
                {item.switch ? (
                  <ToggleSwitch
                    checked={item.switch.checked}
                    label={item.switch.label}
                    tone="green"
                    onChange={item.switch.onChange}
                  />
                ) : null}
                {item.switch ? <Chevron /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function StudioScreen({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  const { t } = useTranslations();
  return (
    <>
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("common.back", "Atpakaļ")}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-[#5d6672] hover:bg-[#eef1f6]"
        >
          <Chevron back />
        </button>
        <h2 className="font-display text-xl font-bold tracking-[-0.03em]">{title}</h2>
      </div>
      <div className="flex flex-col gap-3 pt-1">{children}</div>
    </>
  );
}

export function StudioGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="choice">
      {title ? <h3 className="font-semibold">{title}</h3> : null}
      {children}
    </section>
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

function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-4 shrink-0 text-[#5d6672] ${back ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
