import type { DropEdge } from "@/app/lib/dnd-reorder";

/** Zila līnija virs/zem rindas — kur nonāks vilktais bloks. */
export function DropLine({ edge }: { edge: DropEdge }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute right-1 left-1 z-10 h-0.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_1px_rgba(47,91,255,0.25)] ${
        edge === "before" ? "-top-1" : "-bottom-1"
      }`}
    />
  );
}
