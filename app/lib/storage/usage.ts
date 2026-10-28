import { createClient } from "@/app/lib/supabase/client";

export type StorageUsage = {
  bytesUsed: number;
  quotaBytes: number | null;
};

function parseUsage(raw: unknown): StorageUsage | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { bytes_used?: unknown; quota_bytes?: unknown };
  const bytesUsed =
    typeof row.bytes_used === "number"
      ? row.bytes_used
      : typeof row.bytes_used === "string"
        ? Number(row.bytes_used)
        : NaN;
  if (!Number.isFinite(bytesUsed)) return null;
  let quotaBytes: number | null = null;
  if (row.quota_bytes != null && row.quota_bytes !== "") {
    const q =
      typeof row.quota_bytes === "number"
        ? row.quota_bytes
        : typeof row.quota_bytes === "string"
          ? Number(row.quota_bytes)
          : NaN;
    if (Number.isFinite(q) && q >= 0) quotaBytes = q;
  }
  return { bytesUsed: Math.max(0, Math.round(bytesUsed)), quotaBytes };
}

export async function fetchMyStorageUsage(): Promise<StorageUsage | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_my_storage_usage");
  if (error) return null;
  return parseUsage(data);
}

export type StorageUploadMeta = {
  originalName?: string;
  sourceMime?: string;
};

export async function recordUserStorageUpload(input: {
  bucket: string;
  path: string;
  byteSize: number;
  mimeType: string;
  extension: string;
  meta?: StorageUploadMeta;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.byteSize <= 0) return { ok: false, error: "Invalid size" };
  const supabase = createClient();
  const { error } = await supabase.rpc("record_user_storage_file", {
    p_bucket: input.bucket,
    p_object_path: input.path,
    p_byte_size: input.byteSize,
    p_mime_type: input.mimeType,
    p_file_extension: input.extension,
    p_original_name: input.meta?.originalName ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function fileExtensionFromMime(mimeType: string, fallback = "bin"): string {
  const part = mimeType.split("/")[1]?.toLowerCase();
  if (!part) return fallback;
  if (part === "jpeg") return "jpg";
  return part.replace(/[^a-z0-9]/g, "") || fallback;
}
