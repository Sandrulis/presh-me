import type { FrontendModuleAccess } from "@/app/lib/modules/user-module-access";

/** Paid module visible in UI but user lacks subscription that includes it. */
export function isModuleProLocked(access: FrontendModuleAccess): boolean {
  return (
    access.moduleEnabled && access.isPaid && access.paidPlansEnabled && access.canUse !== true
  );
}
