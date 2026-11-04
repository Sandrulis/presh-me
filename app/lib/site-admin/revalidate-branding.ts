"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateSiteBrandingCache() {
  revalidateTag("site-branding", "max");
  revalidatePath("/brand/icon");
  revalidatePath("/brand/logo");
  revalidatePath("/brand/notification-icon");
  revalidatePath("/", "layout");
}
