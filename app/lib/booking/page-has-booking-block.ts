/** Lightweight check against `content.blocks` json without full `rowToPortfolio`. */
export function pageJsonHasBookingBlock(blocks: unknown, blockId: string): boolean {
  if (!blockId || !Array.isArray(blocks)) return false;
  return blocks.some((item) => {
    if (!item || typeof item !== "object") return false;
    const row = item as { type?: unknown; id?: unknown };
    return row.type === "booking" && String(row.id ?? "") === blockId;
  });
}
