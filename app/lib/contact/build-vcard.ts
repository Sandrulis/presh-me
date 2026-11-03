import { resolveContactAvatarUrl, splitDisplayName } from "@/app/lib/contact/contact-avatar";
import type { PageContent } from "@/app/lib/types";

function escapeVcard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldVcardProperty(property: string, value: string): string {
  const line = `${property}:${value}`;
  const max = 75;
  if (line.length <= max) return line;
  let out = line.slice(0, max);
  let rest = line.slice(max);
  while (rest.length > 0) {
    out += `\r\n ${rest.slice(0, max - 1)}`;
    rest = rest.slice(max - 1);
  }
  return out;
}

async function loadPhotoBase64(url: string): Promise<{ data: string; type: "JPEG" | "PNG" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") ?? "";
    const type: "JPEG" | "PNG" = mime.includes("png") ? "PNG" : "JPEG";
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return { data: btoa(binary), type };
  } catch {
    return null;
  }
}

export async function buildVcardText(page: PageContent): Promise<string> {
  const { first, last, full } = splitDisplayName(page.displayName);
  const fn = full || "Contact";
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0", foldVcardProperty("FN", escapeVcard(fn))];

  lines.push(foldVcardProperty("N", `${escapeVcard(last)};${escapeVcard(first)};;;`));

  const company = page.contactCompany?.trim();
  if (company) lines.push(foldVcardProperty("ORG", escapeVcard(company)));

  const phone = page.contactPhone?.trim();
  if (phone) lines.push(foldVcardProperty("TEL;TYPE=CELL", escapeVcard(phone)));

  const email = page.contactEmail?.trim();
  if (email) lines.push(foldVcardProperty("EMAIL;TYPE=INTERNET", escapeVcard(email)));

  const photoUrl = resolveContactAvatarUrl(page);
  if (photoUrl) {
    const photo = await loadPhotoBase64(photoUrl);
    if (photo) {
      lines.push(foldVcardProperty(`PHOTO;ENCODING=b;TYPE=${photo.type}`, photo.data));
    }
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export async function downloadContactVcard(page: PageContent, fileBaseName: string) {
  const text = await buildVcardText(page);
  const blob = new Blob([text], { type: "text/vcard;charset=utf-8" });
  const safe =
    fileBaseName
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60) || "contact";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safe}.vcf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
