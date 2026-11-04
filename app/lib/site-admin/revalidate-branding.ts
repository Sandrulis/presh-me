"use server";

import { revalidatePath, updateTag } from "next/cache";

export async function revalidateSiteBrandingCache() {
  // Immediate expire — public Header/Logo must not keep SWR-stale branding.
  updateTag("site-branding");
  revalidatePath("/brand/icon");
  revalidatePath("/brand/logo");
  revalidatePath("/brand/notification-icon");
  revalidatePath("/", "layout");
}
