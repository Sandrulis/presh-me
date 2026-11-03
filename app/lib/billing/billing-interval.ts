export type BillingInterval = "month" | "year";

export function parseBillingInterval(raw: unknown): BillingInterval {
  return raw === "year" ? "year" : "month";
}
