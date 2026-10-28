import { uploadPageAsset } from "@/app/lib/storage/page-assets";
import { createClient } from "@/app/lib/supabase/client";

type CoverOpts = { mode: "cover"; width: number; height: number; folder?: string };
type FitOpts = { mode: "fit"; maxEdge?: number; folder?: string };

/** Compress image on canvas → JPEG File → Storage public URL (no data URL in jsonb). */
export async function processAndUploadImage(
  file: File | undefined,
  opts: CoverOpts | FitOpts,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: "Izvēlies attēlu." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Izvēlies attēlu." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nepieciešama sesija." };

  let jpeg: File;
  try {
    jpeg =
      opts.mode === "cover"
        ? await canvasToJpegFile(file, opts.width, opts.height, "cover")
        : await canvasToJpegFile(file, opts.maxEdge ?? 1400, opts.maxEdge ?? 1400, "fit");
  } catch {
    return { ok: false, error: "Neizdevās nolasīt attēlu." };
  }

  const uploaded = await uploadPageAsset(user.id, jpeg, opts.folder ?? "uploads", {
    originalName: file.name,
    sourceMime: file.type,
  });
  if (!uploaded.ok) return { ok: false, error: uploaded.error };
  return { ok: true, url: uploaded.url };
}

async function canvasToJpegFile(
  file: File,
  widthOrMax: number,
  heightOrMax: number,
  mode: "cover" | "fit",
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  let width: number;
  let height: number;
  if (mode === "fit") {
    const maxEdge = widthOrMax;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    width = Math.max(1, Math.round(bitmap.width * scale));
    height = Math.max(1, Math.round(bitmap.height * scale));
  } else {
    width = widthOrMax;
    height = heightOrMax;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("canvas");
  }

  if (mode === "cover") {
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const drawnWidth = bitmap.width * scale;
    const drawnHeight = bitmap.height * scale;
    context.drawImage(bitmap, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
  } else {
    context.drawImage(bitmap, 0, 0, width, height);
  }
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("blob"))), "image/jpeg", 0.82);
  });
  return new File([blob], "image.jpg", { type: "image/jpeg" });
}
