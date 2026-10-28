/** Human-readable size for storage UI (B / KB / MB / GB). */
export function formatStorageSize(bytes: number): string {
  const value = Number.isFinite(bytes) ? Math.max(0, Math.round(bytes)) : 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) {
    const kb = value / 1024;
    return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)} KB`;
  }
  if (value < 1024 * 1024 * 1024) {
    const mb = value / (1024 * 1024);
    return `${mb >= 10 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
  }
  const gb = value / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}
