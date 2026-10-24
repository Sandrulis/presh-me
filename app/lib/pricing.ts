/** Public pricing — keep claims honest. Pro price is a placeholder until billing ships. */
export const PRICING = {
  free: {
    id: "free-beta",
    priceLabel: "€0",
    period: "beta",
  },
  pro: {
    id: "pro",
    /** Placeholder until Stripe plans are live — do not present as a live checkout price. */
    priceLabel: "€9",
    period: "month",
    comingSoon: true,
  },
} as const;
