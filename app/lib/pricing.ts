/** Public pricing copy — live checkout follows DB plan prices when billing module is on. */
export const PRICING = {
  free: {
    id: "basic",
    priceLabel: "€0",
    period: "month",
  },
  pro: {
    id: "pro",
    priceLabel: "€9",
    period: "month",
    comingSoon: false,
  },
} as const;
