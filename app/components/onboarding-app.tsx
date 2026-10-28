"use client";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { AuthShowcase } from "@/app/components/auth-showcase";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { LoadingScreen } from "@/app/components/loading-screen";
import { ColorPicker } from "@/app/components/color-picker";
import { DevicePreview } from "@/app/components/device-preview";
import { FieldFrame } from "@/app/components/field-frame";
import { FontSelect } from "@/app/components/font-select";
import { BannerContentAlignSwitch, BannerContentSwitch, HeaderLayoutSwitch } from "@/app/components/header-layout-switch";
import { ImageDropField, useImageFileDrop } from "@/app/components/image-drop-field";
import { useTranslations } from "@/app/components/translations-provider";
import { imageFrame, pageImageFrame, panLimits, placedImageStyle } from "@/app/lib/image-frame";
import { LINK_UNAVAILABLE, linkFieldError, normalizeHandle } from "@/app/lib/handles";
import { instagramName, publicHttpUrl, type SourcePreview } from "@/app/lib/source-preview";
import {
  claimInstagramAvatar,
  createPageForAccount,
  emptyOnboarding,
  getPageForAccount,
  getSessionId,
  isHandleTaken,
  isStoreReady,
  savePage,
  subscribeStore,
} from "@/app/lib/store";
import { normalizeOnboardingStep } from "@/app/lib/onboarding/destination";
import { getTheme, themes } from "@/app/lib/themes";
import type { FontId, Onboarding, Portfolio, SectionId, StepId, StepMark } from "@/app/lib/types";

const STEP_IDS: StepId[] = ["start", "profile", "sections", "look", "link"];

type TranslateFn = (key: string, fallback: string, params?: Record<string, string | number>) => string;

function nextLabels(t: TranslateFn) {
  return [
    t("onboarding.next.meet", "Iepazīsties"),
    t("onboarding.next.sections", "Sadaļas"),
    t("onboarding.next.look", "Izskats"),
    t("onboarding.next.link", "Links"),
    t("onboarding.next.summary", "Kopsavilkums"),
  ];
}

function sectionChoices(t: TranslateFn): { id: SectionId; title: string; text: string }[] {
  return [
    {
      id: "links",
      title: t("onboarding.section.links.title", "Linki"),
      text: t("onboarding.section.links.text", "Pogas saitēm, ko dalies visbiežāk."),
    },
    {
      id: "instagram",
      title: t("onboarding.section.instagram.title", "Bildes no Instagram"),
      text: t("onboarding.section.instagram.text", "Režģis, ja profilu izdodas nolasīt."),
    },
    {
      id: "carousel",
      title: t("onboarding.section.carousel.title", "Karuselis"),
      text: t("onboarding.section.carousel.text", "Kartītes, ko var pāršķirt."),
    },
    {
      id: "faq",
      title: t("onboarding.section.faq.title", "FAQ"),
      text: t("onboarding.section.faq.text", "Īsas atbildes uz biežiem jautājumiem."),
    },
  ];
}

const CONFETTI_COLORS = ["#2f5bff", "#d6ff4a", "#ff8fb8", "#8d7cff", "#ffd089", "#7cffb2", "#ffffff", "#ff5b7a"];

const CONFETTI = Array.from({ length: 52 }, (_, index) => {
  const spread = (index * 37 + 11) % 100;
  return {
    left: `${Math.min(98, 2 + spread)}%`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length]!,
    delay: `${((index * 0.065) % 1.6).toFixed(2)}s`,
    w: 6 + (index % 5) * 2,
    h: 9 + (index % 4) * 3,
    drift: `${-56 + ((index * 23) % 112)}px`,
    dur: `${(3.6 + (index % 6) * 0.14).toFixed(2)}s`,
  };
});

function readPage() {
  const sessionId = getSessionId();
  if (!sessionId) return null;
  return getPageForAccount(sessionId);
}

export function OnboardingApp() {
  const router = useRouter();
  const { t } = useTranslations();
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const stored = useSyncExternalStore(subscribeStore, readPage, () => null);
  const [draft, setDraft] = useState<Portfolio | null>(null);
  const { notices, notify, dismissNotice } = useNotices();
  const [pending, setPending] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  const [creatingPage, setCreatingPage] = useState(false);

  useEffect(() => {
    if (ready && !sessionId) router.replace("/login");
  }, [ready, sessionId, router]);

  useEffect(() => {
    if (!ready || !sessionId || stored) return;
    let cancelled = false;
    setCreatingPage(true);
    void createPageForAccount(sessionId)
      .catch(() => {
        if (!cancelled) {
          notify(t("onboarding.error.create_page", "Neizdevās izveidot jaunu lapu. Mēģini vēlreiz."), "error");
        }
      })
      .finally(() => {
        if (!cancelled) setCreatingPage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, sessionId, stored, notify, t]);

  useEffect(() => {
    if (stored?.onboarding?.finished) router.replace("/studio");
  }, [stored, router]);

  if (stored?.onboarding?.finished) {
    return <LoadingScreen label="common.loading" backdrop="app" />;
  }

  if (stored && draft?.id !== stored.id) {
    const rawOnboarding = stored.onboarding ?? emptyOnboarding();
    const onboarding = normalizeOnboardingStep(rawOnboarding);
    const base = { ...stored, fontId: stored.fontId ?? "sans", onboarding };
    const next = claimInstagramAvatar(base);
    const stepChanged = onboarding.step !== rawOnboarding.step && !onboarding.finished;
    if (stepChanged || next !== base) {
      void savePage({ ...next, updatedAt: new Date().toISOString() });
    }
    setDraft(next);
    setLinkDraft(next.handle);
  }

  if (!ready || !sessionId || !draft || !draft.onboarding) {
    return <LoadingScreen label={creatingPage ? "page.creating" : "common.loading"} />;
  }

  const page = draft as Portfolio & { onboarding: Onboarding };
  const onboarding = page.onboarding;
  const step = onboarding.step;
  const preview = step === 5 ? { ...page, handle: normalizeHandle(linkDraft) || page.handle } : page;

  function save(next: Portfolio) {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    void savePage(stamped);
    setDraft(stamped);
  }

  function go(nextStep: number, id: StepId, mark: StepMark, patch: Partial<Portfolio> = {}) {
    const { onboarding: onboardingPatch, ...rest } = patch;
    const base = onboardingPatch ?? page.onboarding;
    const next = {
      ...page,
      ...rest,
      onboarding: { ...base, step: nextStep, marks: { ...base.marks, [id]: mark } },
    } as Portfolio;
    save(next);
  }

  async function continueStart() {
    const source = page.onboarding.source;
    if (!source) {
      notify(t("onboarding.error.pick_source", "Izvēlies, kā sākt."), "error");
      return;
    }
    setPending(true);
    if (source === "scratch") {
      go(2, "start", "done", {
        onboarding: {
          ...page.onboarding,
          source: "scratch",
          sourceNote: t("onboarding.source.note_scratch", "No nulles."),
        },
      });
      setPending(false);
      return;
    }
    if (source === "instagram") {
      const name = instagramName(page.onboarding.instagram);
      if (!name) {
        notify(t("onboarding.error.instagram", "Ievadi Instagram lietotājvārdu."), "error");
        setPending(false);
        return;
      }
      const previewResult = await lookup("instagram", name);
      const url = `https://instagram.com/${name}`;
      const socials = page.socials.some((item) => item.platform === "instagram")
        ? page.socials.map((item) => (item.platform === "instagram" ? { ...item, url } : item))
        : [...page.socials, { id: crypto.randomUUID(), platform: "instagram" as const, url }];
      const profileImage = previewResult.ok ? previewResult.image : null;
      const images = previewResult.ok ? previewResult.images.filter((src) => src !== profileImage) : [];
      const note = previewResult.ok
        ? previewResult.description || `@${name}`
        : previewResult.message;
      go(2, "start", "done", {
        socials,
        avatarUrl: page.avatarUrl ?? profileImage,
        gallery: images,
        sections: images.length > 0 ? ["instagram", "links"] : page.sections,
        onboarding: {
          ...page.onboarding,
          instagram: name,
          sourceNote: note,
          sections: images.length > 0 ? ["instagram", "links"] : page.onboarding.sections,
        },
      });
      setPending(false);
      return;
    }
    const site = publicHttpUrl(page.onboarding.website);
    if (!site) {
      notify(t("onboarding.error.website", "Ievadi publisku lapas adresi."), "error");
      setPending(false);
      return;
    }
    const previewResult = await lookup("website", site.toString());
    if (!previewResult.ok) {
      notify(translateActionMessage(t, previewResult.message), "error");
      setPending(false);
      return;
    }
    const links =
      previewResult.links.length > 0
        ? previewResult.links
        : [
            {
              title: previewResult.title || t("onboarding.website_fallback", "Mājaslapa"),
              url: site.toString(),
            },
          ];
    go(2, "start", "done", {
      bio: page.bio.trim() ? page.bio : previewResult.description,
      avatarUrl: page.avatarUrl ?? previewResult.image,
      blocks: [
        ...page.blocks,
        ...links.map((item) => ({ id: crypto.randomUUID(), type: "link" as const, title: item.title, url: item.url, note: "" })),
      ],
      sections: ["links"],
      onboarding: {
        ...page.onboarding,
        website: site.toString(),
        sourceNote: previewResult.title || site.hostname,
        sections: ["links"],
      },
    });
    setPending(false);
  }

  function continueProfile() {
    go(3, "profile", "done");
  }

  function continueSections() {
    const sections = page.onboarding.sections.length > 0 ? page.onboarding.sections : page.sections ?? [];
    let next: Portfolio = { ...page, sections };
    if (sections.includes("links") && !next.blocks.some((block) => block.type === "link")) {
      next = {
        ...next,
        blocks: [
          ...next.blocks,
          { id: crypto.randomUUID(), type: "link", title: t("onboarding.seed.link", "Mana saite"), url: "", note: "" },
        ],
      };
    }
    if (sections.includes("carousel") && (!next.carousel || next.carousel.length === 0)) {
      next = {
        ...next,
        carousel: [
          t("onboarding.seed.carousel_1", "Jaunums"),
          t("onboarding.seed.carousel_2", "Projekts"),
          t("onboarding.seed.carousel_3", "Saite"),
        ].map((title) => ({ id: crypto.randomUUID(), title, note: "" })),
      };
    }
    if (sections.includes("faq") && (!next.faqs || next.faqs.length === 0)) {
      next = {
        ...next,
        faqs: [
          {
            id: crypto.randomUUID(),
            question: t("onboarding.faq.default_q", "Biežākais jautājums"),
            answer: "",
          },
        ],
      };
    }
    go(4, "sections", "done", next);
  }

  function continueLook() {
    go(5, "look", "done");
  }

  const linkValue = normalizeHandle(linkDraft);
  const linkInvalid = linkFieldError(linkDraft);
  const linkTaken = !linkInvalid && isHandleTaken(linkValue, page.id);
  const linkMessage = linkInvalid ?? (linkTaken ? LINK_UNAVAILABLE : null);
  const linkFree = linkMessage === null;

  function continueLink() {
    if (!linkFree) return;
    go(6, "link", "done", { handle: linkValue });
  }

  function skip() {
    const id = STEP_IDS[step - 1];
    if (!id || id === "link") return;
    go(step + 1, id, "skipped");
  }

  function back() {
    if (step <= 1) return;
    save({ ...page, onboarding: { ...page.onboarding, step: step - 1 } });
  }

  function finish() {
    save({ ...page, onboarding: { ...page.onboarding, finished: true, step: 6 } });
    router.push("/studio");
  }

  return (
    <AppShell>
      <div className="grid min-h-screen bg-[#f6f7fb] lg:h-[100dvh] lg:grid-cols-[minmax(22rem,36rem)_minmax(0,1fr)] lg:overflow-hidden">
        <div className="relative flex flex-col overflow-y-auto px-5 py-5 sm:px-8 lg:h-full lg:px-10">
          {step === 6 ? <Confetti /> : null}
          <div className="flex items-center justify-between gap-3">
            <div className="wizard-progress flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={step}>
              <span style={{ width: `${Math.round((step / 6) * 100)}%` }} />
            </div>
            {step > 1 && step < 6 ? (
              <button type="button" className="btn-quiet shrink-0" onClick={back}>
                {t("common.back", "Atpakaļ")}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-center text-xs text-[var(--muted)]">
            {step < 6
              ? t("onboarding.progress.next", "Tālāk: {label}", { label: nextLabels(t)[step - 1] })
              : t("onboarding.progress.done", "Pabeigts")}
          </p>
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col py-8">
            {step === 1 ? (
              <StepStart
                onboarding={onboarding}
                pending={pending}
                onChange={(patch) => setDraft({ ...draft, onboarding: { ...onboarding, ...patch } })}
                onContinue={() => void continueStart()}
                onSkip={skip}
              />
            ) : null}
            {step === 2 ? (
              <StepProfile
                draft={draft}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
                onError={(message) => notify(translateActionMessage(t, message), "error")}
                onContinue={continueProfile}
                onSkip={skip}
              />
            ) : null}
            {step === 3 ? (
              <StepSections
                selected={onboarding.sections.length > 0 ? onboarding.sections : draft.sections ?? []}
                onToggle={(id) => {
                  const current = onboarding.sections.length > 0 ? onboarding.sections : draft.sections ?? [];
                  const sections = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                  setDraft({ ...draft, sections, onboarding: { ...onboarding, sections } });
                }}
                onContinue={continueSections}
                onSkip={skip}
              />
            ) : null}
            {step === 4 ? (
              <StepLook
                themeId={draft.themeId}
                fontId={draft.fontId ?? "sans"}
                onTheme={(themeId) => setDraft({ ...draft, themeId })}
                onFont={(fontId) => setDraft({ ...draft, fontId, onboarding: { ...onboarding, fontId } })}
                onContinue={continueLook}
                onSkip={skip}
              />
            ) : null}
            {step === 5 ? (
              <StepLink
                value={linkDraft}
                free={linkFree}
                message={linkMessage}
                onChange={setLinkDraft}
                onContinue={continueLink}
              />
            ) : null}
            {step === 6 ? <StepDone draft={draft} onFinish={finish} /> : null}
          </div>
        </div>
        {step === 1 ? <AuthShowcase /> : (
          <aside className="auth-stage flex min-h-0 flex-col items-center justify-start overflow-y-auto px-6 py-8 lg:min-h-0 lg:h-full">
            <DevicePreview page={preview} />
          </aside>
        )}
        <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      </div>
    </AppShell>
  );
}

function StepStart({
  onboarding,
  pending,
  onChange,
  onContinue,
  onSkip,
}: {
  onboarding: Onboarding;
  pending: boolean;
  onChange: (patch: Partial<Onboarding>) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslations();
  return (
    <>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em]">
        {t("onboarding.start.title", "Kā gribi sākt?")}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {t("onboarding.start.lead", "Izvēlies vienu. Vēlāk varēsi mainīt.")}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <div className="choice" data-selected={onboarding.source === "instagram"}>
          <button type="button" className="block w-full text-left" aria-pressed={onboarding.source === "instagram"} onClick={() => onChange({ source: "instagram" })}>
            <span className="block font-semibold">{t("onboarding.from_instagram", "No Instagram")}</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">
              {t("onboarding.from_instagram.hint", "Lietotājvārds, un paskatāmies, ko no profila var paņemt.")}
            </span>
          </button>
          {onboarding.source === "instagram" ? (
            <input
              className="auth-field mt-3"
              value={onboarding.instagram}
              placeholder={t("onboarding.instagram_ph", "lietotajvards")}
              aria-label={t("onboarding.instagram_username", "Instagram lietotājvārds")}
              onChange={(event) => onChange({ instagram: event.target.value })}
            />
          ) : null}
        </div>
        <div className="choice" data-selected={onboarding.source === "website"}>
          <button type="button" className="block w-full text-left" aria-pressed={onboarding.source === "website"} onClick={() => onChange({ source: "website" })}>
            <span className="block font-semibold">{t("onboarding.from_website", "No mājaslapas")}</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">
              {t("onboarding.from_website.hint", "Nosaukums, apraksts un saites no jau esošas lapas.")}
            </span>
          </button>
          {onboarding.source === "website" ? (
            <input
              className="auth-field mt-3"
              value={onboarding.website}
              placeholder="https://"
              aria-label={t("onboarding.website_url", "Mājaslapas adrese")}
              onChange={(event) => onChange({ website: event.target.value })}
            />
          ) : null}
        </div>
        <button type="button" className="choice" aria-pressed={onboarding.source === "scratch"} onClick={() => onChange({ source: "scratch" })}>
          <span className="block font-semibold">{t("onboarding.from_scratch", "No nulles")}</span>
          <span className="mt-1 block text-sm text-[var(--muted)]">
            {t("onboarding.from_scratch.hint", "Tukša lapa. Visu saliksi pats.")}
          </span>
        </button>
      </div>
      <button type="button" className="btn-auth mt-6" disabled={pending} onClick={onContinue}>
        {pending ? t("onboarding.start.looking", "Skatos...") : t("common.continue", "Turpināt")}
      </button>
      <button type="button" className="btn-line mt-3 w-full" disabled={pending} onClick={onSkip}>
        {t("common.skip", "Izlaist šo soli")}
      </button>
    </>
  );
}

function StepProfile({
  draft,
  onChange,
  onError,
  onContinue,
  onSkip,
}: {
  draft: Portfolio;
  onChange: (patch: Partial<Portfolio>) => void;
  onError: (message: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const layout = draft.headerLayout ?? "center";
  const banner = layout !== "center";
  const theme = getTheme(draft.themeId);
  const themeHex = /^#[0-9a-fA-F]{6}$/.test(theme.background) ? theme.background : "#f4f6f8";
  const avatarRadius = draft.avatarRadius ?? 50;
  const avatarBorder = draft.avatarBorder ?? (draft.avatarUrl || layout === "banner-center" ? 3 : 0);
  const avatarBorderColor = draft.avatarBorderColor ?? "#ffffff";
  const avatarFill = draft.avatarColor ?? "#eef1f6";
  const themeBand = theme.button === theme.background ? theme.text : theme.button;
  const bannerFill =
    draft.bannerColor && /^#[0-9a-fA-F]{6}$/.test(draft.bannerColor)
      ? draft.bannerColor
      : /^#[0-9a-fA-F]{6}$/.test(themeBand)
        ? themeBand
        : "#111111";
  const { t } = useTranslations();
  const pageFrame = pageImageFrame(draft.pageImagePosition, draft.pageImageX, draft.pageImageY, draft.pageImageZoom);
  const [panel, setPanel] = useState<ProfilePanel | null>(null);
  const [closing, setClosing] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<null | "banner" | "avatar" | "page">(null);
  const panelVisible = panel !== null && !closing;

  function showPanel(next: ProfilePanel) {
    if (panel === next) {
      if (!closing) setClosing(true);
      return;
    }
    setPanel(next);
    setClosing(false);
  }

  const panels: Record<ProfilePanel, { title: string; body: ReactNode }> = {
    banner: {
      title: t("studio.look.background", "Fons"),
      body: (
        <>
          {layout === "banner-left" ? (
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <BannerContentSwitch
                  value={draft.bannerContentPlace ?? "beside"}
                  onChange={(bannerContentPlace) => onChange({ bannerContentPlace })}
                />
                <BannerContentAlignSwitch
                  value={draft.bannerContentAlign ?? ((draft.bannerContentPlace ?? "beside") === "above" ? "center" : "left")}
                  onChange={(bannerContentAlign) => onChange({ bannerContentAlign })}
                />
              </div>
              <RangeField
                label={t("onboarding.content_align", "Satura vertikāle")}
                min={0}
                max={100}
                value={draft.bannerContentY ?? 50}
                suffix=" %"
                onChange={(bannerContentY) => onChange({ bannerContentY })}
              />
            </div>
          ) : null}
          <div className={`flex items-center gap-3 ${layout === "banner-left" ? "mt-3" : ""}`}>
            <ColorPicker label={t("onboarding.bg_color", "Fona krāsa")} value={bannerFill} onChange={(bannerColor) => onChange({ bannerColor })} />
            <span className="text-sm text-[var(--muted)]">{t("onboarding.bg_color", "Fona krāsa")}</span>
          </div>
          <ImageDrop
            title={t("onboarding.image.bg", "Fona attēls")}
            hint={t("onboarding.image.drop", "Ievelc attēlu vai izvēlies failu.")}
            onFile={(file) => void readBanner(file, onChange, onError)}
            preview={
              draft.bannerUrl ? (
                <DeletableImage onDelete={() => setRemoveTarget("banner")}>
                  <FramedThumb src={draft.bannerUrl} x={draft.bannerX} y={draft.bannerY} zoom={draft.bannerZoom} className="h-14 w-24 rounded-md" />
                </DeletableImage>
              ) : (
                <span className="block h-14 w-24 shrink-0 rounded-md" style={{ background: bannerFill }} />
              )
            }
          />
          {draft.bannerUrl ? (
            <ImagePlace
              x={draft.bannerX ?? 50}
              y={draft.bannerY ?? 50}
              zoom={draft.bannerZoom ?? 100}
              onChange={({ x, y, zoom }) => onChange({ bannerX: x, bannerY: y, bannerZoom: zoom })}
            />
          ) : null}
          <RangeField
            label={t("studio.look.height", "Augstums")}
            min={18}
            max={85}
            value={draft.bannerHeight ?? 40}
            suffix=" %"
            onChange={(bannerHeight) => onChange({ bannerHeight })}
          />
          <RangeField
            label={t("onboarding.transition", "Pāreja")}
            min={0}
            max={100}
            value={draft.bannerFadeAmount ?? (draft.bannerFade ? 40 : 0)}
            suffix=" %"
            onChange={(bannerFadeAmount) => onChange({ bannerFadeAmount, bannerFade: bannerFadeAmount > 0 })}
          />
        </>
      ),
    },
    avatar: {
      title: t("onboarding.profile.image", "Profila attēls"),
      body: (
        <>
          <ImageDrop
            title={t("onboarding.image.title", "Attēls")}
            hint={t("onboarding.image.drop", "Ievelc attēlu vai izvēlies failu.")}
            onFile={(file) => void readAvatar(file, onChange, onError)}
            preview={
              <AvatarThumb
                url={draft.avatarUrl}
                x={draft.avatarX}
                y={draft.avatarY}
                zoom={draft.avatarZoom}
                radius={avatarRadius}
                fill={avatarFill}
                ink={draft.avatarColor ? inkFor(draft.avatarColor) : "var(--muted)"}
                border={avatarBorder > 0 ? Math.min(avatarBorder, 4) : 0}
                borderColor={avatarBorderColor}
                sizeClass="h-14 w-14"
                onDelete={draft.avatarUrl ? () => setRemoveTarget("avatar") : undefined}
              />
            }
          />
          {draft.avatarUrl ? (
            <ImagePlace
              x={draft.avatarX ?? 50}
              y={draft.avatarY ?? 50}
              zoom={draft.avatarZoom ?? 100}
              onChange={({ x, y, zoom }) => onChange({ avatarX: x, avatarY: y, avatarZoom: zoom })}
            />
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <ColorPicker label={t("onboarding.icon_bg", "Ikonas fons")} value={draft.avatarColor ?? "#eef1f6"} onChange={(avatarColor) => onChange({ avatarColor })} />
            <span className="text-sm text-[var(--muted)]">{t("onboarding.icon_bg", "Ikonas fons")}</span>
          </div>
          <RangeField label={t("onboarding.avatar_radius", "Noapaļojums")} min={0} max={50} value={avatarRadius} suffix="%" onChange={(avatarRadius) => onChange({ avatarRadius })} />
          <RangeField label={t("studio.look.border_width", "Apmales biezums")} min={0} max={16} value={avatarBorder} suffix=" px" onChange={(avatarBorder) => onChange({ avatarBorder })} />
          <div className="mt-3 flex items-center gap-3">
            <ColorPicker
              label={t("onboarding.border_color", "Apmales krāsa")}
              value={/^#[0-9a-fA-F]{6}$/.test(avatarBorderColor) ? avatarBorderColor : "#ffffff"}
              onChange={(avatarBorderColor) => onChange({ avatarBorderColor })}
            />
            <span className="text-sm text-[var(--muted)]">{t("onboarding.border_color", "Apmales krāsa")}</span>
          </div>
        </>
      ),
    },
    page: {
      title: t("studio.look.page_bg", "Lapas fons"),
      body: (
        <>
          <div className="flex items-center gap-3">
            <ColorPicker label={t("onboarding.bg_color", "Fona krāsa")} value={draft.pageColor ?? themeHex} onChange={(pageColor) => onChange({ pageColor })} />
            <span className="text-sm text-[var(--muted)]">{t("onboarding.bg_color", "Fona krāsa")}</span>
          </div>
          <ImageDrop
            title={t("onboarding.image.bg", "Fona attēls")}
            hint={t("onboarding.image.drop", "Ievelc attēlu vai izvēlies failu.")}
            onFile={(file) => void readPageImage(file, onChange, onError)}
            preview={
              draft.pageImageUrl ? (
                <DeletableImage onDelete={() => setRemoveTarget("page")}>
                  <FramedThumb src={draft.pageImageUrl} x={pageFrame.x} y={pageFrame.y} zoom={pageFrame.zoom} className="h-14 w-14 rounded-md" />
                </DeletableImage>
              ) : (
                <EmptyThumb className="h-14 w-14" />
              )
            }
          />
          {draft.pageImageUrl ? (
            <ImagePlace
              x={pageFrame.x}
              y={pageFrame.y}
              zoom={pageFrame.zoom}
              onChange={({ x, y, zoom }) => onChange({ pageImageX: x, pageImageY: y, pageImageZoom: zoom })}
            />
          ) : null}
        </>
      ),
    },
    icons: {
      title: t("onboarding.socials.title", "Sociālās ikonas"),
      body: (
        <RangeField
          label={t("onboarding.icon_size", "Ikonu izmērs")}
          min={24}
          max={72}
          value={draft.socialIconSize ?? 40}
          suffix=" px"
          onChange={(socialIconSize) => onChange({ socialIconSize })}
        />
      ),
    },
  };
  const active = panel ? panels[panel] : null;

  return (
    <>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em]">
        {t("onboarding.meet.title", "Iepazīsties")}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {t("onboarding.meet.lead", "Bilde, vārds, tagline un bio. Labajā pusē ir lapas skats.")}
      </p>
      <div className="mt-5 flex justify-center">
        <HeaderLayoutSwitch value={layout} onChange={(headerLayout) => onChange({ headerLayout })} />
      </div>
      {banner ? (
        <OptionRow
          title={t("studio.look.background", "Fons")}
          hint={t("onboarding.banner.hint", "Krāsa, attēls un augstums.")}
          open={panel === "banner" && panelVisible}
          onOpen={() => showPanel("banner")}
          onImageFile={(file) => void readBanner(file, onChange, onError)}
          preview={
            draft.bannerUrl ? (
              <DeletableImage onDelete={() => setRemoveTarget("banner")}>
                <FramedThumb src={draft.bannerUrl} x={draft.bannerX} y={draft.bannerY} zoom={draft.bannerZoom} className="h-12 w-20 rounded-md" />
              </DeletableImage>
            ) : (
              <span className="block h-12 w-20 shrink-0 rounded-md" style={{ background: bannerFill }} />
            )
          }
        />
      ) : null}
      <OptionRow
        title={t("onboarding.profile.image", "Profila attēls")}
        hint={t("onboarding.profile.image_hint", "Forma, apmale un attēls.")}
        open={panel === "avatar" && panelVisible}
        onOpen={() => showPanel("avatar")}
        onImageFile={(file) => void readAvatar(file, onChange, onError)}
        preview={
          <AvatarThumb
            url={draft.avatarUrl}
            x={draft.avatarX}
            y={draft.avatarY}
            zoom={draft.avatarZoom}
            radius={avatarRadius}
            fill={avatarFill}
            ink={draft.avatarColor ? inkFor(draft.avatarColor) : "var(--muted)"}
            border={avatarBorder > 0 ? Math.min(avatarBorder, 3) : 0}
            borderColor={avatarBorderColor}
            sizeClass="h-12 w-12"
            onDelete={draft.avatarUrl ? () => setRemoveTarget("avatar") : undefined}
          />
        }
      />
      <FieldFrame label={t("common.name", "Vārds")} className="mt-4">
        <input
          className="auth-field"
          value={draft.displayName}
          placeholder={t("onboarding.name_ph", "Vārds Uzvārds")}
          onChange={(event) => onChange({ displayName: event.target.value })}
        />
      </FieldFrame>
      <FieldFrame label={t("studio.profile.tagline", "Tagline")}>
        <input
          className="auth-field"
          value={draft.tagline ?? ""}
          maxLength={80}
          placeholder={t("onboarding.tagline_ph", "Īss slogan zem vārda")}
          onChange={(event) => onChange({ tagline: event.target.value })}
        />
      </FieldFrame>
      <FieldFrame label={t("studio.profile.bio", "Bio")}>
        <textarea
          className="auth-area"
          value={draft.bio}
          maxLength={160}
          placeholder={t("onboarding.bio_ph", "Īsi, ko dari")}
          onChange={(event) => onChange({ bio: event.target.value })}
        />
      </FieldFrame>
      <OptionRow
        title={t("studio.look.page_bg", "Lapas fons")}
        hint={t("onboarding.page_bg.hint", "Krāsa un fona attēls.")}
        open={panel === "page" && panelVisible}
        onOpen={() => showPanel("page")}
        onImageFile={(file) => void readPageImage(file, onChange, onError)}
        preview={
          draft.pageImageUrl ? (
            <DeletableImage onDelete={() => setRemoveTarget("page")}>
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md" style={{ background: draft.pageColor ?? themeHex }}>
                <FramedThumb src={draft.pageImageUrl} x={pageFrame.x} y={pageFrame.y} zoom={pageFrame.zoom} className="h-full w-full" />
              </span>
            </DeletableImage>
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md" style={{ background: draft.pageColor ?? themeHex }} />
          )
        }
      />
      <OptionRow
        title={t("onboarding.socials.title", "Sociālās ikonas")}
        hint={t("onboarding.socials.hint", "Ikonu izmērs lapā.")}
        open={panel === "icons" && panelVisible}
        onOpen={() => showPanel("icons")}
        preview={
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[var(--line)] text-xs text-[var(--muted)]">
            {draft.socialIconSize ?? 40}
          </span>
        }
      />
      <button type="button" className="btn-auth mt-6" onClick={onContinue}>
        {t("common.continue", "Turpināt")}
      </button>
      <button type="button" className="btn-line mt-3 w-full" onClick={onSkip}>
        {t("common.skip", "Izlaist šo soli")}
      </button>
      {active ? (
        <OptionDrawer
          title={active.title}
          closing={closing}
          onClose={() => setClosing(true)}
          onClosed={() => {
            setPanel(null);
            setClosing(false);
          }}
        >
          {active.body}
        </OptionDrawer>
      ) : null}
      {removeTarget ? (
        <ConfirmDeleteModal
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            if (removeTarget === "banner") onChange({ bannerUrl: null });
            if (removeTarget === "avatar") onChange({ avatarUrl: null });
            if (removeTarget === "page") onChange({ pageImageUrl: null });
            setRemoveTarget(null);
          }}
        />
      ) : null}
    </>
  );
}

type ProfilePanel = "banner" | "avatar" | "page" | "icons";

function OptionDrawer({
  title,
  closing,
  onClose,
  onClosed,
  children,
}: {
  title: string;
  closing: boolean;
  onClose: () => void;
  onClosed: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslations();
  const panelRef = useRef<HTMLDivElement>(null);
  const onClosedRef = useRef(onClosed);
  onClosedRef.current = onClosed;

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    const anim = node.animate(
      closing
        ? [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }]
        : [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }],
      { duration: closing ? 240 : 280, easing: closing ? "ease-in" : "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    if (closing) anim.onfinish = () => onClosedRef.current();
    return () => anim.cancel();
  }, [closing]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || closing) return;
      onClose();
    }
    function onPointer(event: MouseEvent) {
      if (closing) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      const element = target instanceof Element ? target : target.parentElement;
      if (element?.closest("[role='listbox'], [role='dialog'], button[aria-expanded]")) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [closing, onClose]);

  return createPortal(
    <div ref={panelRef} className="option-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <h2 className="font-display text-xl font-bold tracking-[-0.03em]">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("actions.close", "Aizvērt")}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-[#5d6672] hover:bg-[#eef1f6]"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
    </div>,
    document.body,
  );
}

function OptionRow({
  title,
  hint,
  open,
  onOpen,
  onImageFile,
  preview,
}: {
  title: string;
  hint: string;
  open: boolean;
  onOpen: () => void;
  onImageFile?: (file: File) => void;
  preview?: ReactNode;
}) {
  const { t } = useTranslations();
  const dropEnabled = Boolean(onImageFile);
  const dropActiveHint = t("onboarding.image.drop_release", "Atlaid šeit");
  const { active, dragDropProps, openPicker, fileInput } = useImageFileDrop(
    (file) => {
      if (file && onImageFile) onImageFile(file);
    },
    dropEnabled,
  );

  return (
    <div
      className={`choice mt-4 flex items-center gap-3 ${dropEnabled ? "choice-image-drop" : ""} ${active ? "choice-image-drop-active" : ""}`.trim()}
      {...(dropEnabled ? dragDropProps : {})}
      onClick={
        dropEnabled
          ? (event) => {
              const target = event.target;
              if (!(target instanceof Element)) return;
              if (target.closest("button")) return;
              openPicker();
            }
          : undefined
      }
      onKeyDown={
        dropEnabled
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              if (event.target instanceof Element && event.target.closest("button")) return;
              event.preventDefault();
              openPicker();
            }
          : undefined
      }
      role={dropEnabled ? "button" : undefined}
      tabIndex={dropEnabled ? 0 : undefined}
    >
      <div className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">{active ? dropActiveHint : hint}</span>
      </div>
      {preview}
      <OpenOptionsButton
        label={t("common.section_options", "{title} opcijas", { title })}
        open={open}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
      />
      {dropEnabled ? fileInput : null}
    </div>
  );
}

function OpenOptionsButton({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-lg text-[#5d6672] hover:bg-[#eef1f6]"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function DeletableImage({ onDelete, children }: { onDelete: () => void; children: ReactNode }) {
  const { t } = useTranslations();
  return (
    <span className="relative inline-flex shrink-0">
      {children}
      <button
        type="button"
        aria-label={t("studio.blocks.remove_image", "Noņemt attēlu")}
        className="absolute top-0 right-0 z-10 grid size-5 translate-x-1/3 -translate-y-1/3 place-items-center rounded-full bg-[#111] text-white ring-2 ring-white"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete();
        }}
      >
        <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
          <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}

function AvatarThumb({
  url,
  x,
  y,
  zoom,
  radius,
  fill,
  ink,
  border,
  borderColor,
  sizeClass,
  onDelete,
}: {
  url: string | null;
  x?: number;
  y?: number;
  zoom?: number;
  radius: number;
  fill: string;
  ink: string;
  border: number;
  borderColor: string;
  sizeClass: string;
  onDelete?: () => void;
}) {
  const face = (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden text-xs font-medium ${sizeClass}`}
      style={{
        borderRadius: `${radius}%`,
        background: fill,
        color: ink,
        border: border > 0 ? `${border}px solid ${borderColor}` : undefined,
      }}
    >
      {url ? <FramedThumb src={url} x={x} y={y} zoom={zoom} className="h-full w-full" /> : "+"}
    </span>
  );
  if (!onDelete) return face;
  return <DeletableImage onDelete={onDelete}>{face}</DeletableImage>;
}

function ConfirmDeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslations();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-[#0e1116]/40 p-5"
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.delete_image.title", "Dzēst attēlu?")}
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(14,17,22,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold tracking-[-0.03em]">
          {t("onboarding.delete_image.title", "Dzēst attēlu?")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {t("onboarding.delete_image.body", "Vai tiešām vēlies dzēst šo attēlu?")}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-line" onClick={onCancel}>
            {t("actions.cancel", "Atcelt")}
          </button>
          <button type="button" className="btn-ink" style={{ background: "#c43b3b" }} onClick={onConfirm}>
            {t("actions.delete", "Dzēst")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ImageDrop({
  title,
  hint,
  preview,
  onFile,
}: {
  title: string;
  hint: string;
  preview: ReactNode;
  onFile: (file: File | undefined) => void;
}) {
  return <ImageDropField className="mt-3" title={title} hint={hint} preview={preview} onFile={onFile} />;
}

function EmptyThumb({ className }: { className: string }) {
  return <span className={`grid shrink-0 place-items-center rounded-md bg-[#eef1f6] text-xs text-[var(--muted)] ${className}`}>+</span>;
}

function StepSections({
  selected,
  onToggle,
  onContinue,
  onSkip,
}: {
  selected: SectionId[];
  onToggle: (id: SectionId) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslations();
  const choices = sectionChoices(t);
  return (
    <>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em]">
        {t("onboarding.sections.title", "Sadaļas")}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {t("onboarding.sections.lead", "Ko rādīt lapā. Saturu saliksi vēlāk.")}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {choices.map((item) => (
          <button key={item.id} type="button" className="choice" aria-pressed={selected.includes(item.id)} onClick={() => onToggle(item.id)}>
            <span className="block font-semibold">{item.title}</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">{item.text}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn-auth mt-6" onClick={onContinue}>
        {selected.length > 0
          ? t("onboarding.sections.add", "Pievienot {count}", { count: selected.length })
          : t("common.continue", "Turpināt")}
      </button>
      <button type="button" className="btn-line mt-3 w-full" onClick={onSkip}>
        {t("common.skip", "Izlaist šo soli")}
      </button>
    </>
  );
}

function StepLook({
  themeId,
  fontId,
  onTheme,
  onFont,
  onContinue,
  onSkip,
}: {
  themeId: string;
  fontId: FontId;
  onTheme: (id: string) => void;
  onFont: (id: FontId) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslations();
  return (
    <>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em]">
        {t("onboarding.look.title", "Izskats")}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {t("onboarding.look.lead", "Fons, burti un pogas. Skats labajā pusē mainās uzreiz.")}
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className="choice px-2 py-2"
            aria-pressed={themeId === theme.id}
            onClick={() => onTheme(theme.id)}
          >
            <span className="block rounded-xl px-2 py-3" style={{ background: theme.background, color: theme.text }}>
              <span className="mx-auto block h-6 w-6 rounded-full" style={{ background: theme.button }} />
              <span className="mt-2 block h-2 rounded-full" style={{ background: theme.button }} />
              <span className="mt-1 block h-2 w-2/3 rounded-full" style={{ background: theme.button, opacity: 0.7 }} />
            </span>
            <span className="mt-2 block text-center text-xs font-semibold">{theme.name}</span>
          </button>
        ))}
      </div>
      <p className="auth-label mt-5">{t("onboarding.look.fonts", "Burti")}</p>
      <FontSelect value={fontId} onChange={onFont} label={t("onboarding.look.fonts", "Burti")} />
      <button type="button" className="btn-auth mt-6" onClick={onContinue}>
        {t("common.next", "Tālāk")}
      </button>
      <button type="button" className="btn-line mt-3 w-full" onClick={onSkip}>
        {t("common.skip", "Izlaist šo soli")}
      </button>
    </>
  );
}

function StepLink({
  value,
  free,
  message,
  onChange,
  onContinue,
}: {
  value: string;
  free: boolean;
  message: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslations();
  return (
    <>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em]">
        {t("onboarding.link.title", "Tavs links")}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {t("onboarding.link.lead", "Ievadi adresi. Uzreiz redzēsi, vai tā ir brīva.")}
      </p>
      <label className="mt-6 block">
        <span className="auth-label">{t("onboarding.link.label", "Links")}</span>
        <span className="auth-handle" data-invalid={free ? undefined : "true"} data-valid={free ? "true" : undefined}>
          <span className="shrink-0 pl-3 text-sm text-[var(--muted)]">presh.me/</span>
          <input
            className="min-w-0 flex-1 border-0 bg-transparent px-2 text-[0.95rem] outline-none"
            value={value}
            aria-invalid={!free}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
      </label>
      {free ? null : (
        <p className="mt-2 text-sm text-[var(--stamp)]" role="status">
          {message}
        </p>
      )}
      <button type="button" className="btn-auth mt-6" disabled={!free} onClick={onContinue}>
        {t("onboarding.progress.done", "Pabeigts")}
      </button>
    </>
  );
}

function StepDone({ draft, onFinish }: { draft: Portfolio; onFinish: () => void }) {
  const { t } = useTranslations();
  const marks = draft.onboarding?.marks;
  const rows = [
    { label: t("onboarding.summary.start", "Sākums"), value: startSummary(draft, t) },
    {
      label: t("onboarding.summary.profile", "Profils"),
      value: marks?.profile === "done" ? draft.displayName.trim() || t("onboarding.mark.done", "Izpildīts") : markText(marks?.profile, t),
    },
    {
      label: t("onboarding.sections.title", "Sadaļas"),
      value: marks?.sections === "done" ? sectionSummary(draft.onboarding?.sections ?? [], t) : markText(marks?.sections, t),
    },
    {
      label: t("onboarding.look.title", "Izskats"),
      value: marks?.look === "done" ? themeName(draft.themeId, t) : markText(marks?.look, t),
    },
    {
      label: t("onboarding.link.label", "Links"),
      value: marks?.link === "done" ? `presh.me/${draft.handle}` : markText(marks?.link, t),
    },
  ];
  return (
    <>
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em]">
        {t("onboarding.ready.title", "Gatavs.")}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
        {t("onboarding.summary.lead", "Kas izdarīts un kas izlaists. Tālāk ir studija.")}
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.label} className="choice flex items-center justify-between gap-3 py-3">
            <span className="font-semibold">{row.label}</span>
            <span className="text-sm text-[var(--muted)]">{row.value}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-auth mt-6" onClick={onFinish}>
        {t("onboarding.to_studio", "Uz studiju")}
      </button>
    </>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {CONFETTI.map((piece, index) => (
        <i
          key={`${piece.left}-${index}`}
          style={{
            left: piece.left,
            background: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.dur,
            width: piece.w,
            height: piece.h,
            ["--confetti-drift" as string]: piece.drift,
          }}
        />
      ))}
    </div>
  );
}

function startSummary(draft: Portfolio, t: TranslateFn) {
  const onboarding = draft.onboarding;
  if (!onboarding || onboarding.marks.start === "skipped") return t("onboarding.mark.skipped", "Izlaists");
  if (onboarding.source === "instagram") return onboarding.instagram ? `@${onboarding.instagram}` : "Instagram";
  if (onboarding.source === "website") return t("onboarding.website_fallback", "Mājaslapa");
  if (onboarding.source === "scratch") return t("onboarding.from_scratch", "No nulles");
  return t("onboarding.mark.skipped", "Izlaists");
}

function sectionSummary(sections: SectionId[], t: TranslateFn) {
  if (sections.length === 0) return t("onboarding.summary.none", "Neviena");
  const names: Record<SectionId, string> = {
    links: t("onboarding.section.links.title", "Linki"),
    instagram: "Instagram",
    carousel: t("onboarding.section.carousel.title", "Karuselis"),
    faq: t("onboarding.section.faq.title", "FAQ"),
  };
  return sections.map((id) => names[id]).join(", ");
}

function themeName(themeId: string, t: TranslateFn) {
  return themes.find((theme) => theme.id === themeId)?.name ?? t("onboarding.look.title", "Izskats");
}

function markText(mark: StepMark | undefined, t: TranslateFn) {
  if (mark === "done") return t("onboarding.mark.done", "Izpildīts");
  return t("onboarding.mark.skipped", "Izlaists");
}

async function lookup(kind: "instagram" | "website", value: string): Promise<SourcePreview> {
  try {
    const response = await fetch("/api/source-preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, value }),
    });
    return (await response.json()) as SourcePreview;
  } catch {
    return { ok: false, message: "onboarding.error.lookup" }; // key — translateActionMessage
  }
}

function ImagePlace({
  x,
  y,
  zoom,
  onChange,
}: {
  x: number;
  y: number;
  zoom: number;
  onChange: (frame: { x: number; y: number; zoom: number }) => void;
}) {
  const { t } = useTranslations();
  const frame = imageFrame(x, y, zoom);
  const limits = panLimits(frame.zoom);
  const locked = limits.min === limits.max;
  return (
    <>
      <RangeField
        label={t("onboarding.horizontal", "Horizontāli")}
        min={limits.min}
        max={limits.max}
        value={frame.x}
        suffix=" %"
        disabled={locked}
        onChange={(next) => onChange(imageFrame(next, frame.y, frame.zoom))}
      />
      <RangeField
        label={t("onboarding.vertical", "Vertikāli")}
        min={limits.min}
        max={limits.max}
        value={frame.y}
        suffix=" %"
        disabled={locked}
        onChange={(next) => onChange(imageFrame(frame.x, next, frame.zoom))}
      />
      <RangeField
        label={t("onboarding.zoom", "Pietuvinājums")}
        min={100}
        max={200}
        value={frame.zoom}
        suffix=" %"
        onChange={(next) => onChange(imageFrame(frame.x, frame.y, next))}
      />
    </>
  );
}

function FramedThumb({
  src,
  x,
  y,
  zoom,
  className,
}: {
  src: string;
  x?: number;
  y?: number;
  zoom?: number;
  className: string;
}) {
  const frame = imageFrame(x, y, zoom);
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="absolute max-w-none" style={placedImageStyle(frame.x, frame.y, frame.zoom)} />
    </span>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  suffix,
  disabled = false,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  suffix: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <label className={`mt-3 block ${disabled ? "opacity-45" : ""}`}>
      <span className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-[var(--muted)]">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full disabled:cursor-not-allowed"
        style={{ "--range-fill": `${fill}%` } as CSSProperties}
      />
    </label>
  );
}

function inkFor(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#111111";
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

async function readPageImage(file: File | undefined, onChange: (patch: Partial<Portfolio>) => void, onError: (message: string) => void) {
  const url = await readImageFit(file, 1400, onError);
  if (url) onChange({ pageImageUrl: url });
}

async function readImageFit(file: File | undefined, maxEdge: number, onError: (message: string) => void) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) {
    onError("onboarding.image.pick");
    return null;
  }
  const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
  const result = await processAndUploadImage(file, { mode: "fit", maxEdge, folder: "onboarding" });
  if (!result.ok) {
    onError(result.error === "Izvēlies attēlu." ? "onboarding.image.pick" : "onboarding.image.read_error");
    return null;
  }
  return result.url;
}

async function readBanner(file: File | undefined, onChange: (patch: Partial<Portfolio>) => void, onError: (message: string) => void) {
  const url = await readImage(file, 960, 420, onError);
  if (url) onChange({ bannerUrl: url });
}

async function readAvatar(file: File | undefined, onChange: (patch: Partial<Portfolio>) => void, onError: (message: string) => void) {
  const url = await readImage(file, 256, 256, onError);
  if (url) onChange({ avatarUrl: url });
}

async function readImage(file: File | undefined, width: number, height: number, onError: (message: string) => void) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) {
    onError("onboarding.image.pick");
    return null;
  }
  const { processAndUploadImage } = await import("@/app/lib/storage/process-upload");
  const result = await processAndUploadImage(file, { mode: "cover", width, height, folder: "onboarding" });
  if (!result.ok) {
    onError(result.error === "Izvēlies attēlu." ? "onboarding.image.pick" : "onboarding.image.read_error");
    return null;
  }
  return result.url;
}

function translateActionMessage(t: TranslateFn, message: string) {
  if (message === "onboarding.error.lookup") {
    return t("onboarding.error.lookup", "Neizdevās nolasīt avotu.");
  }
  if (message === "onboarding.image.pick") {
    return t("onboarding.image.pick", "Izvēlies attēlu.");
  }
  if (message === "onboarding.image.read_error") {
    return t("onboarding.image.read_error", "Neizdevās nolasīt attēlu.");
  }
  return message;
}
