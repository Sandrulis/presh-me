import { createClient } from "@/app/lib/supabase/client";
import { fileExtensionFromMime, recordUserStorageUpload, type StorageUploadMeta } from "@/app/lib/storage/usage";

const BUCKET = "page-assets";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function postFormWithProgress(url: string, file: File, onProgress: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(1, event.loaded / event.total));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Neizdevās augšupielādēt."));
    xhr.send(body);
  });
}

/** Upload image to Storage; returns public URL. Rejects SVG / oversized. */
export async function uploadPageAsset(
  userId: string,
  file: File,
  folder = "uploads",
  meta?: StorageUploadMeta,
  onProgress?: (ratio: number) => void,
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
  if (onProgress) {
    const signed = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (!signed.error && signed.data?.signedUrl) {
      try {
        await postFormWithProgress(signed.data.signedUrl, file, onProgress);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Neizdevās augšupielādēt.";
        return { ok: false, error: message };
      }
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
  }
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) return { ok: false, error: error.message };
  onProgress?.(1);
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
