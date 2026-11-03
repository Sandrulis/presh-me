/** EUR plan price for display — space thousands, dot decimals. */
export function formatPlanPrice(amount: number) {
  const fixed = amount.toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const withSpaces = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `€ ${withSpaces}.${fraction}`;
}

export function eurosToCents(amount: number) {
  return Math.max(0, Math.round(amount * 100));
}
