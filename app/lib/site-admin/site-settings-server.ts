"use server";

import { MAX_BRAND_IMAGE_BYTES, normalizeBrandImageUrl } from "@/app/lib/site-admin/branding";
import type { SiteSettings } from "@/app/lib/site-admin/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";

const BRANDING_BUCKET = "page-assets";

const ALLOWED_BRAND_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

function extensionForMime(mime: string, fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".ico")) return "ico";
  if (lower.endsWith(".svg")) return "svg";
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return "ico";
    default:
      return "bin";
  }
}

async function requireSystemAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nav sesijas.");

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (profile?.is_admin !== true) throw new Error("Nav pieejas.");

  return user;
}

export async function uploadSiteBrandingImage(formData: FormData): Promise<{ url: string }> {
  await requireSystemAdmin();

  const raw = formData.get("file");
  if (!(raw instanceof File) || raw.size <= 0 || raw.size > MAX_BRAND_IMAGE_BYTES) {
    throw new Error("Augšupielādē attēlu līdz 1.5 MB.");
  }

  const mime = raw.type || "application/octet-stream";
  const name = raw.name.toLowerCase();
  const mimeOk =
    ALLOWED_BRAND_MIMES.has(mime) ||
    name.endsWith(".ico") ||
    name.endsWith(".svg") ||
    mime.startsWith("image/");
  if (!mimeOk) throw new Error("Atbalstīti PNG, JPG, WebP, GIF, SVG un ICO.");

  const admin = createAdminClient();
  const ext = extensionForMime(mime, raw.name);
  const path = `system/branding/${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(await raw.arrayBuffer());

  const contentType =
    name.endsWith(".ico") && !mime.startsWith("image/")
      ? "image/x-icon"
      : mime.startsWith("image/")
        ? mime
        : "application/octet-stream";

  const { error } = await admin.storage.from(BRANDING_BUCKET).upload(path, body, {
    contentType,
    upsert: false,
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message);

  const { data } = admin.storage.from(BRANDING_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Neizdevās iegūt publisko URL.");

  return { url: data.publicUrl };
}

export async function saveSiteSettingsServer(settings: SiteSettings): Promise<void> {
  await requireSystemAdmin();

  const trialPeriodDays = Math.min(365, Math.max(1, Math.round(settings.trialPeriodDays)));
  const updatedAt = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .update({
      system_name: settings.systemName.trim() || "Presh",
      legal_email: settings.legalEmail.trim() || "hello@presh.me",
      legal_entity_name: settings.legalEntityName.trim(),
      legal_entity_reg_no: settings.legalEntityRegNo.trim(),
      legal_entity_address: settings.legalEntityAddress.trim(),
      timezone: settings.timezone.trim() || "Europe/Riga",
      date_format: settings.dateFormat,
      date_separator: settings.dateSeparator,
      time_format: settings.timeFormat,
      week_start_day: settings.weekStartDay,
      logo_url: normalizeBrandImageUrl(settings.logoUrl),
      favicon_url: normalizeBrandImageUrl(settings.faviconUrl),
      notification_favicon_url: normalizeBrandImageUrl(settings.notificationFaviconUrl),
      maintenance_mode: settings.maintenanceMode === true,
      trial_period_days: trialPeriodDays,
      updated_at: updatedAt,
    })
    .eq("id", 1)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sistēmas iestatījumu rinda nav atrasta.");
}
