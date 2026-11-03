/** i18n keys for known frontend modules — resolve with `t()` in UI. */
export const KNOWN_MODULE_LABEL_KEYS: Record<string, string> = {
  google_sign_in: "admin.modules.known.google_sign_in",
  public_claim: "admin.modules.known.public_claim",
  support_forms: "admin.modules.known.support_forms",
  module_multisites: "admin.modules.known.module_multisites",
  module_trail: "admin.modules.known.module_trail",
  module_paid_plans: "admin.modules.known.module_paid_plans",
  module_umami: "admin.modules.known.module_umami",
};

export function moduleLabelKey(moduleKey: string): string | null {
  return KNOWN_MODULE_LABEL_KEYS[moduleKey] ?? null;
}
