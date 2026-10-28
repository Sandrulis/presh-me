"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateMaintenanceModeCache() {
  revalidateTag("maintenance-mode", "max");
  revalidatePath("/", "layout");
}
