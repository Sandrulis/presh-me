"use server";

import { revalidatePath, updateTag } from "next/cache";
import { invalidateMaintenanceModeEdgeCache } from "@/app/lib/site-admin/maintenance-mode-cache";

export async function revalidateMaintenanceModeCache() {
  invalidateMaintenanceModeEdgeCache();
  updateTag("maintenance-mode");
  revalidatePath("/", "layout");
}
