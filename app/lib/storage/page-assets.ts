import { createClient } from "@/app/lib/supabase/client";
import { fileExtensionFromMime, recordUserStorageUpload, type StorageUploadMeta } from "@/app/lib/storage/usage";

const BUCKET = "page-assets";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Upload image to Storage; returns public URL. Rejects SVG / oversized. */
export async function uploadPageAsset(
  userId: string,
  file: File,
  folder = "uploads",
  meta?: StorageUploadMeta,
): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Atļauti tikai PNG, JPEG, WebP, GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Fails pārāk liels (max 2 MB)." };
  }
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) return { ok: false, error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const extension = fileExtensionFromMime(file.type, ext);
  void recordUserStorageUpload({
    bucket: BUCKET,
    path,
    byteSize: file.size,
    mimeType: file.type,
    extension,
    meta,
  }).then((recorded) => {
    if (recorded.ok) {
      void import("@/app/lib/store").then((mod) => mod.refreshSessionStorageUsage());
    }
  });

  return { ok: true, url: data.publicUrl, path };
}
