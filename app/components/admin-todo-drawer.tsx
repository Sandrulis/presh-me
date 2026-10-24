"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  addAdminTodo,
  ADMIN_TODO_TITLE_MAX,
  deleteAdminTodo,
  formatTodoCompletedAt,
  listAdminTodos,
  normalizeTodoTitle,
  renameAdminTodo,
  reorderAdminTodos,
  setAdminTodoDone,
  type AdminTodo,
} from "@/app/lib/admin-todos";
import { useTranslations } from "@/app/components/translations-provider";
import { setSiteHasAlert } from "@/app/lib/site-alerts-store";
import { getSessionId } from "@/app/lib/store";

export function AdminTodoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslations();
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function requestClose() {
    if (!closing) setClosing(true);
  }

  useEffect(() => {
    if (!open) {
      setClosing(false);
      return;
    }
    setClosing(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel) return;
    const panelAnim = panel.animate(
      closing
        ? [{ transform: "translateX(0)" }, { transform: "translateX(100%)" }]
        : [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
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
  }, [closing, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || closing) return;
      event.preventDefault();
      requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closing, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85]">
      <button
        ref={backdropRef}
        type="button"
        aria-label={t("actions.close", "Aizvērt")}
        className="absolute inset-0 bg-[var(--ink)]/30"
        style={{ opacity: 0 }}
        onClick={requestClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("admin.todo.title", "Darāmo saraksts")}
        className="absolute top-0 right-0 bottom-0 z-[1] flex w-[min(22rem,100%)] flex-col border-l border-[var(--line)] bg-white shadow-[-12px_0_40px_rgba(14,17,22,0.08)]"
        style={{ transform: "translateX(100%)" }}
      >
        <AdminTodoPanel onClose={requestClose} busy={closing} />
      </div>
    </div>,
    document.body,
  );
}

function AdminTodoPanel({ onClose, busy }: { onClose: () => void; busy?: boolean }) {
  const { t } = useTranslations();
  const accountId = getSessionId();
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [draft, setDraft] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dragId = useRef<string | null>(null);
  const overRef = useRef<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    void listAdminTodos(accountId).then((items) => {
      setTodos(items);
      setSiteHasAlert(items.some((item) => !item.isDone));
    });
  }, [accountId]);

  if (!accountId) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-[var(--muted)]">
        {t("admin.todo.login_required", "Ielogojies, lai redzētu darāmo.")}
      </div>
    );
  }

  const userId = accountId;
  const activeItems = todos.filter((item) => !item.isDone);
  const archivedItems = todos.filter((item) => item.isDone);
  const visibleItems = archiveOpen ? archivedItems : activeItems;
  const canReorder = !archiveOpen && activeItems.length > 1;

  function refresh(next: AdminTodo[] | Promise<AdminTodo[]>) {
    void Promise.resolve(next).then((items) => {
      setTodos(items);
      setSiteHasAlert(items.some((item) => !item.isDone));
    });
  }

  function moveOpen(fromId: string, toId: string) {
    if (fromId === toId) return;
    const open = todos.filter((item) => !item.isDone);
    const from = open.findIndex((item) => item.id === fromId);
    const to = open.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...open];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    refresh(reorderAdminTodos(userId, next.map((entry) => entry.id)));
  }

  function pointOver(clientY: number) {
    const rows = listRef.current?.querySelectorAll<HTMLElement>("[data-todo-id]") ?? [];
    for (const row of rows) {
      const box = row.getBoundingClientRect();
      if (clientY >= box.top && clientY <= box.bottom) return row.dataset.todoId ?? null;
    }
    return null;
  }

  function finishDrag() {
    const fromId = dragId.current;
    const toId = overRef.current;
    dragId.current = null;
    overRef.current = null;
    setDraggingId(null);
    setOverId(null);
    if (fromId && toId) moveOpen(fromId, toId);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    const title = draft;
    setDraft("");
    refresh(addAdminTodo(userId, title));
  }

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[var(--line)] px-3">
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {t("admin.todo.title", "Darāmo saraksts")}
        </h2>
        <button
          type="button"
          aria-pressed={archiveOpen}
          aria-label={t("admin.todo.archive", "Arhīvs")}
          title={t("admin.todo.archive", "Arhīvs")}
          disabled={busy}
          onClick={() => setArchiveOpen((value) => !value)}
          className={`grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)] ${
            archiveOpen ? "bg-[var(--paper)] text-[var(--ink)]" : ""
          }`}
        >
          <ArchiveIcon />
        </button>
        <button
          type="button"
          aria-label={t("actions.close", "Aizvērt")}
          title={t("actions.close", "Aizvērt")}
          disabled={busy}
          onClick={onClose}
          className="grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        >
          <CloseIcon />
        </button>
      </div>

      {archiveOpen ? null : (
        <form onSubmit={onSubmit} className="shrink-0 border-b border-[var(--line)] px-3 py-2">
          <input
            value={draft}
            maxLength={ADMIN_TODO_TITLE_MAX}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
            placeholder={t("admin.todo.new_task", "Jauns uzdevums")}
            aria-label={t("admin.todo.new_task", "Jauns uzdevums")}
            className="h-9 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--ink)]"
          />
        </form>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {visibleItems.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-[var(--muted)]">
            {archiveOpen
              ? t("admin.todo.empty_archive", "Nav pabeigtu uzdevumu.")
              : t("admin.todo.empty_active", "Nav darāmo uzdevumu.")}
          </p>
        ) : (
          <ul ref={listRef} className="space-y-0.5">
            {visibleItems.map((item, index) => (
              <TodoRow
                key={item.id}
                item={item}
                archive={archiveOpen}
                canDrag={canReorder}
                dragging={draggingId === item.id}
                dropTarget={overId === item.id && draggingId != null && draggingId !== item.id}
                onToggle={() => refresh(setAdminTodoDone(userId, item.id, !item.isDone))}
                onRename={(title) => refresh(renameAdminTodo(userId, item.id, title))}
                onDelete={() => refresh(deleteAdminTodo(userId, item.id))}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  dragId.current = item.id;
                  overRef.current = item.id;
                  setDraggingId(item.id);
                  setOverId(item.id);
                  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (dragId.current !== item.id) return;
                  const next = pointOver(event.clientY);
                  if (!next || next === overRef.current) return;
                  overRef.current = next;
                  setOverId(next);
                }}
                onPointerUp={() => {
                  if (dragId.current === item.id) finishDrag();
                }}
                onPointerCancel={() => {
                  if (dragId.current !== item.id) return;
                  dragId.current = null;
                  overRef.current = null;
                  setDraggingId(null);
                  setOverId(null);
                }}
                onKeyMove={(dir) => {
                  const open = todos.filter((entry) => !entry.isDone);
                  const target = dir === "up" ? index - 1 : index + 1;
                  if (target < 0 || target >= open.length) return;
                  moveOpen(item.id, open[target].id);
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function TodoRow({
  item,
  archive,
  canDrag,
  dragging,
  dropTarget,
  onToggle,
  onRename,
  onDelete,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyMove,
}: {
  item: AdminTodo;
  archive: boolean;
  canDrag: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onToggle: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onKeyMove: (dir: "up" | "down") => void;
}) {
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const titleClass = `text-sm leading-5 ${archive ? "text-[var(--muted)] line-through" : "text-[var(--ink)]"}`;

  useEffect(() => {
    if (!editing) {
      setDraft(item.title);
      return;
    }
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, [editing, item.title]);

  function startEdit() {
    editingRef.current = true;
    setDraft(item.title);
    setEditing(true);
  }

  function cancelEdit() {
    editingRef.current = false;
    setDraft(item.title);
    setEditing(false);
  }

  function commitEdit() {
    if (!editingRef.current) return;
    editingRef.current = false;
    const next = normalizeTodoTitle(draft);
    setEditing(false);
    if (!next || next === item.title) {
      setDraft(item.title);
      return;
    }
    onRename(next);
  }

  function onTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  return (
    <li
      data-todo-id={archive ? undefined : item.id}
      className={`group/item flex items-start gap-1 rounded-lg px-1 py-1.5 ${
        dragging ? "opacity-50" : ""
      } ${dropTarget ? "ring-2 ring-[var(--accent)]" : ""}`}
    >
      {canDrag ? (
        <button
          type="button"
          className="mt-0.5 grid size-6 shrink-0 place-items-center text-[var(--muted)] hover:text-[var(--ink)]"
          aria-label={t("admin.todo.drag_reorder", "Vilkt, lai mainītu secību")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            onKeyMove(event.key === "ArrowUp" ? "up" : "down");
          }}
        >
          <GripIcon />
        </button>
      ) : (
        <span className="size-6 shrink-0" aria-hidden="true" />
      )}
      <button
        type="button"
        role="checkbox"
        aria-checked={item.isDone}
        aria-label={item.title}
        onClick={onToggle}
        className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded border transition ${
          item.isDone
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-[var(--line)] bg-white text-transparent hover:border-[var(--muted)]"
        }`}
      >
        <CheckIcon />
      </button>
      <div className={`min-w-0 flex-1 ${editing ? "" : "cursor-text"}`} onClick={editing ? undefined : startEdit}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            maxLength={ADMIN_TODO_TITLE_MAX}
            aria-label={t("actions.edit", "Labot")}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onTitleKeyDown}
            onBlur={commitEdit}
            onPointerDown={(event) => event.stopPropagation()}
            className={`h-5 w-full bg-transparent outline-none ${titleClass}`}
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            onPointerDown={(event) => event.stopPropagation()}
            className={`block w-full min-w-0 text-left ${titleClass}`}
          >
            {item.title}
          </button>
        )}
        {archive && item.completedAt ? (
          <p className="mt-0.5 text-[11px] leading-4 text-[var(--muted)]">
            {t("admin.todo.completed_at", "Pabeigts {date}", {
              date: formatTodoCompletedAt(item.completedAt),
            })}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={t("actions.delete", "Dzēst")}
        title={t("actions.delete", "Dzēst")}
        onClick={onDelete}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[var(--muted)] opacity-0 transition group-hover/item:opacity-100 hover:bg-[var(--paper)] hover:text-[var(--stamp)] focus-visible:opacity-100"
      >
        <CloseIcon />
      </button>
    </li>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="3.5" r="1.2" />
      <circle cx="11" cy="3.5" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12.5" r="1.2" />
      <circle cx="11" cy="12.5" r="1.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2.5 6.2 4.8 8.5 9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" strokeLinejoin="round" />
      <path d="M3 5.5h18V8H3V5.5Z" strokeLinejoin="round" />
      <path d="M10 12h4" strokeLinecap="round" />
    </svg>
  );
}
