export type DropEdge = "before" | "after";

export type DropTarget = {
  id: string;
  edge: DropEdge;
};

/** Kur ievietot vilkto elementu masīvā bez tā paša (pēc izņemšanas). */
export function dropInsertIndex(ids: string[], dragId: string, target: DropTarget): number | null {
  if (target.id === dragId) return null;
  const rest = ids.filter((id) => id !== dragId);
  const over = rest.indexOf(target.id);
  if (over < 0) return null;
  return target.edge === "before" ? over : over + 1;
}

/** Vai drop mainītu secību (pretējā gadījumā indikatoru nerāda). */
export function dropWouldMove(ids: string[], dragId: string, target: DropTarget): boolean {
  const insertAt = dropInsertIndex(ids, dragId, target);
  if (insertAt == null) return false;
  const from = ids.indexOf(dragId);
  if (from < 0) return false;
  return insertAt !== from;
}

export function edgeFromPointer(clientY: number, top: number, height: number): DropEdge {
  return clientY < top + height / 2 ? "before" : "after";
}

export function reorderByInsertIndex<T extends { id: string }>(items: T[], dragId: string, insertAt: number): T[] {
  const from = items.findIndex((item) => item.id === dragId);
  if (from < 0) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (!item) return items;
  const clamped = Math.max(0, Math.min(insertAt, next.length));
  next.splice(clamped, 0, item);
  if (next.every((entry, index) => entry.id === items[index]?.id)) return items;
  return next;
}

export function commitDropReorder<T extends { id: string }>(items: T[], dragId: string, target: DropTarget | null): T[] | null {
  if (!target) return null;
  const ids = items.map((item) => item.id);
  if (!dropWouldMove(ids, dragId, target)) return null;
  const insertAt = dropInsertIndex(ids, dragId, target);
  if (insertAt == null) return null;
  return reorderByInsertIndex(items, dragId, insertAt);
}
