"use client";

import { ImagePlaceControls } from "@/app/components/image-place-controls";
import { ImageDropField } from "@/app/components/image-drop-field";
import { ContactAvatarFace } from "@/app/components/contact-avatar-face";
import { FieldFrame } from "@/app/components/field-frame";
import { StudioGroup } from "@/app/components/studio-nav";
import { useTranslations } from "@/app/components/translations-provider";
import { contactAvatarSourceOf, resolveContactAvatarUrl } from "@/app/lib/contact/contact-avatar";
import { sanitizeContactPhoneInput } from "@/app/lib/contact/sanitize-phone";
import type { Portfolio } from "@/app/lib/types";

type Props = {
  page: Portfolio;
  update: (patch: Partial<Portfolio>) => void;
  onError: (message: string) => void;
  accountEmail: string | null;
};

export function StudioContactEditor({ page, update, onError, accountEmail }: Props) {
  const { t } = useTranslations();
  const source = contactAvatarSourceOf(page);
  const name = page.displayName.trim() || t("onboarding.name_ph", "Vārds Uzvārds");
  const suggestedEmail = accountEmail?.trim() ?? "";
  const hasAvatarImage = Boolean(resolveContactAvatarUrl(page));

  return (
    <StudioGroup>
      <p className="text-xs text-[var(--muted)]">
        {t("studio.contact.name_hint", "Vārds un uzvārds no sadaļas Profils.")}
      </p>

      <div className="mt-4 flex justify-center">
        <ContactAvatarFace page={page} name={name} />
      </div>

      <FieldFrame label={t("studio.share.avatar_source", "Avatars")}>
            <div className="grid gap-2">
              <ChoiceRow
                checked={source === "profile"}
                label={t("studio.share.use_profile", "Profila attēls")}
                onSelect={() => update({ contactAvatarSource: "profile" })}
              />
              <ChoiceRow
                checked={source === "custom"}
                label={t("studio.share.custom_image", "Cits attēls")}
                onSelect={() => update({ contactAvatarSource: "custom" })}
              />
            </div>
          </FieldFrame>

          {source === "custom" ? (
            <ContactImageField
              title={t("studio.share.upload", "Augšupielādēt attēlu")}
              src={page.contactAvatarUrl}
              onFile={async (file) => {
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  onError(t("onboarding.image.pick", "Izvēlies attēlu."));
                  return;
                }
                const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
                const result = await processAndUploadImage(file, {
                  mode: "cover",
                  width: 256,
                  height: 256,
                  folder: "contact",
                });
                if (!result.ok) {
                  onError(result.error ?? t("onboarding.image.read_error", "Neizdevās nolasīt attēlu."));
                  return;
                }
                update({ contactAvatarUrl: result.url, contactAvatarSource: "custom" });
              }}
              onClear={() => update({ contactAvatarUrl: null })}
            />
          ) : null}

          {hasAvatarImage ? (
            <FieldFrame label={t("studio.share.image_position", "Attēla novietojums")}>
              {source === "profile" ? (
                <ImagePlaceControls
                  x={page.avatarX}
                  y={page.avatarY}
                  zoom={page.avatarZoom}
                  onChange={({ x, y, zoom }) => update({ avatarX: x, avatarY: y, avatarZoom: zoom })}
                />
              ) : (
                <ImagePlaceControls
                  x={page.contactAvatarX}
                  y={page.contactAvatarY}
                  zoom={page.contactAvatarZoom}
                  onChange={({ x, y, zoom }) => update({ contactAvatarX: x, contactAvatarY: y, contactAvatarZoom: zoom })}
                />
              )}
            </FieldFrame>
          ) : null}

          <FieldFrame label={t("studio.contact.phone", "Tālrunis")}>
            <input
              className="auth-field"
              type="tel"
              inputMode="tel"
              value={page.contactPhone ?? ""}
              placeholder="+371 2000 0000"
              autoComplete="tel"
              onChange={(event) => update({ contactPhone: sanitizeContactPhoneInput(event.target.value) })}
            />
          </FieldFrame>

          <FieldFrame label={t("common.email", "E-pasts")}>
            <input
              className="auth-field"
              type="email"
              value={page.contactEmail ?? ""}
              placeholder={suggestedEmail || "tavs@epasts.lv"}
              autoComplete="email"
              onChange={(event) => update({ contactEmail: event.target.value })}
            />
            {!page.contactEmail?.trim() && suggestedEmail ? (
              <button
                type="button"
                className="btn-quiet mt-2 text-left text-xs"
                onClick={() => update({ contactEmail: suggestedEmail })}
              >
                {t("studio.contact.use_account_email", "Izmantot {email}", { email: suggestedEmail })}
              </button>
            ) : null}
          </FieldFrame>

          <FieldFrame label={t("studio.contact.company", "Uzņēmums")}>
            <input
              className="auth-field"
              value={page.contactCompany ?? ""}
              maxLength={120}
              placeholder={t("studio.contact.company_ph", "Kompānijas nosaukums")}
              onChange={(event) => update({ contactCompany: event.target.value })}
            />
          </FieldFrame>
    </StudioGroup>
  );
}

function ChoiceRow({ checked, label, onSelect }: { checked: boolean; label: string; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
        checked ? "border-[var(--ink)] bg-[var(--paper)] font-medium" : "border-[var(--line)] hover:bg-[var(--paper)]"
      }`}
      onClick={onSelect}
    >
      <span
        className={`grid size-4 place-items-center rounded-full border ${checked ? "border-[var(--ink)]" : "border-[var(--line)]"}`}
        aria-hidden="true"
      >
        {checked ? <span className="size-2 rounded-full bg-[var(--ink)]" /> : null}
      </span>
      {label}
    </button>
  );
}

function ContactImageField({
  title,
  src,
  onFile,
  onClear,
}: {
  title: string;
  src?: string | null;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const { t } = useTranslations();
  return (
    <div className="mt-3">
      <ImageDropField
        title={title}
        onFile={onFile}
        preview={
          <span className="relative inline-flex shrink-0">
            <span className="relative block h-14 w-14 overflow-hidden rounded-md bg-[#eef1f6]">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="size-full object-contain" />
              ) : (
                <span className="grid h-full place-items-center text-xs text-[var(--muted)]">+</span>
              )}
            </span>
            {src ? (
              <button
                type="button"
                aria-label={t("actions.delete", "Dzēst")}
                className="absolute top-0 right-0 z-10 grid size-5 translate-x-1/3 -translate-y-1/3 place-items-center rounded-full bg-[#111] text-white ring-2 ring-white"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onClear();
                }}
              >
                <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </span>
        }
      />
    </div>
  );
}
