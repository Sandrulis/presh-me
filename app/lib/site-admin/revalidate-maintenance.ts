"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { invalidateMaintenanceModeEdgeCache } from "@/app/lib/site-admin/maintenance-mode-cache";

export async function revalidateMaintenanceModeCache() {
  invalidateMaintenanceModeEdgeCache();
  revalidateTag("maintenance-mode", "max");
  revalidatePath("/", "layout");
}
