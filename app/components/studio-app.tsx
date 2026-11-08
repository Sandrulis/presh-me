"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/app/components/app-shell";
import { BlocksEditor } from "@/app/components/blocks-editor";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { DevicePreview } from "@/app/components/device-preview";
import { FieldFrame } from "@/app/components/field-frame";
import { LoadingScreen } from "@/app/components/loading-screen";
import { LookColumn } from "@/app/components/studio-look";
import { StudioGroup, StudioMenu, StudioScreen } from "@/app/components/studio-nav";
import { StudioBillingSidebar } from "@/app/components/studio-billing-sidebar";
import { StudioAnalyticsEditor } from "@/app/components/studio-analytics-editor";
import { StudioContactEditor } from "@/app/components/studio-contact-editor";
import { StudioShareEditor } from "@/app/components/studio-share-editor";
import { StudioPageLanguageDrawer } from "@/app/components/studio-page-language-drawer";
import { StudioPageSettingsDrawer } from "@/app/components/studio-page-settings-drawer";
import { SocialsEditor } from "@/app/components/socials-editor";
import { useTranslations } from "@/app/components/translations-provider";
import { pagePublicLanguageLabel } from "@/app/lib/i18n/resolve-page-public-language";
import { LINK_UNAVAILABLE, linkFieldError, normalizeHandle } from "@/app/lib/handles";
import { claimInstagramAvatar, getAccount, getPageForAccount, getSessionId, isHandleTaken, isStoreReady, savePage, subscribeStore } from "@/app/lib/store";
import { resolveEntryPathForPortfolio } from "@/app/lib/onboarding/primary-page";
import { isFrontendModuleEnabled } from "@/app/lib/site-admin/modules";
import { useSubscriptionPlanLabels } from "@/app/lib/billing/use-subscription-plan-labels";
import { isModuleProLocked } from "@/app/lib/modules/is-module-pro-locked";
import { useFrontendModuleAccess } from "@/app/lib/modules/use-frontend-module-access";
import { parseUmamiShareUrl } from "@/app/lib/integrations/umami/share";
import { resolveStackOrder, type PageBlock, type Portfolio, type StackSection } from "@/app/lib/types";

type Panel = "info" | "preview" | "look";
type InfoId = "link" | "profile" | "share" | "contact" | "analytics" | "socials" | "blocks";

function handleStatus(raw: string, pageId: string) {
  const invalid = linkFieldError(raw);
  const value = normalizeHandle(raw);
  const taken = !invalid && isHandleTaken(value, pageId);
  const message = invalid ?? (taken ? LINK_UNAVAILABLE : null);
  return { value, message, free: message === null };
}

function readStudioPage() {
  const sessionId = getSessionId();
  if (!sessionId) return null;
  return getPageForAccount(sessionId);
}

function readStudioAccount() {
  const sessionId = getSessionId();
  if (!sessionId) return null;
  return getAccount(sessionId);
}

export function StudioApp() {
  const { t, languages, languageCode } = useTranslations();
  const router = useRouter();
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const page = useSyncExternalStore(subscribeStore, readStudioPage, () => null);
  const account = useSyncExternalStore(subscribeStore, readStudioAccount, () => null);
  const [panel, setPanel] = useState<Panel>("info");
  const [infoView, setInfoView] = useState<InfoId | null>(null);
  const [handleDraft, setHandleDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [blockDraft, setBlockDraft] = useState<PageBlock | null>(null);
  const [blockDrawerOpen, setBlockDrawerOpen] = useState(false);
  const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [trailModuleEnabled, setTrailModuleEnabled] = useState(false);
  const [paidPlansModuleEnabled, setPaidPlansModuleEnabled] = useState(false);
  const { notices, notify, dismissNotice } = useNotices();
  const { access: umamiAccess } = useFrontendModuleAccess("module_umami");
  const { badgeLabelForModule } = useSubscriptionPlanLabels(languageCode);
  const umamiProLocked = isModuleProLocked(umamiAccess);
  const showUmamiBasics = umamiAccess.moduleEnabled;
  const umamiPlanBadge = umamiProLocked
    ? badgeLabelForModule("module_umami", t("studio.subscription.plan_unknown", "Plāns"))
    : undefined;
  const umamiPlanBadgeLabel = umamiPlanBadge
    ? t("studio.basics.plan_badge", "Pieejams ar plānu {plan}", { plan: umamiPlanBadge })
    : undefined;

  useEffect(() => {
    let cancelled = false;
    void isFrontendModuleEnabled("module_trail").then((enabled) => {
      if (!cancelled) setTrailModuleEnabled(enabled);
    });
    void isFrontendModuleEnabled("module_paid_plans").then((enabled) => {
      if (!cancelled) setPaidPlansModuleEnabled(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!page || !trailModuleEnabled || !page.published || page.trialStartedAt) return;
    void savePage({ ...page, trialStartedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }, [page, trailModuleEnabled]);

  useEffect(() => {
    if (ready && !sessionId) router.replace("/login");
  }, [ready, sessionId, router]);

  useEffect(() => {
    if (!ready || !sessionId) return;
    if (page === null) return;
    if (resolveEntryPathForPortfolio(page) === "/start") {
      router.replace("/start");
    }
  }, [ready, sessionId, page, router]);

  useEffect(() => {
    if (!page) return;
    if (page.onboarding && !page.onboarding.finished) return;
    const next = claimInstagramAvatar(page);
    if (next === page) return;
    void savePage({ ...next, updatedAt: new Date().toISOString() });
  }, [page, router]);

  function togglePublished() {
    if (!page) return;
    const nextPublished = !page.published;
    const patch: Partial<Portfolio> = { published: nextPublished };
    if (nextPublished && trailModuleEnabled && !page.trialStartedAt) {
      patch.trialStartedAt = new Date().toISOString();
    }
    update(patch);
  }

  function update(patch: Partial<Portfolio>) {
    if (!page) return;
    void savePage({ ...page, ...patch, updatedAt: new Date().toISOString() });
  }

  function commitHandle() {
    if (!page) return;
    const status = handleStatus(handleDraft ?? page.handle, page.id);
    if (!status.free) return;
    update({ handle: status.value });
    setHandleDraft(status.value);
    notify(t("studio.link_saved", "Links saglabāts."), "ok");
  }

  async function copyLink() {
    if (!page) return;
    const url = `${window.location.origin}/${page.handle}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function setContactEnabled(contactEnabled: boolean) {
    if (!page) return;
    const suggestedEmail = account?.email?.trim() ?? "";
    if (contactEnabled && !page.contactEmail?.trim() && suggestedEmail) {
      update({ contactEnabled, contactEmail: suggestedEmail });
      return;
    }
    update({ contactEnabled });
  }

  if (!ready || !sessionId || page === null) {
    return <LoadingScreen label="studio.loading" backdrop="app" />;
  }

  if (resolveEntryPathForPortfolio(page) === "/start") {
    return <LoadingScreen label="studio.loading" backdrop="app" />;
  }

  const publicPath = `/${page.handle}`;
  const linkStatus = handleStatus(handleDraft ?? page.handle, page.id);
  const umamiShareReady = Boolean(parseUmamiShareUrl(page.umamiShareUrl ?? ""));
  const previewPage =
    blockDraft && !page.blocks.some((item) => item.id === blockDraft.id)
      ? { ...page, blocks: [...page.blocks, blockDraft] }
      : page;
  const visitorLanguageLabel = t("studio.language.visitor_default", "Apmeklētāja valoda");

  return (
    <AppShell>
      <div className="flex h-[100dvh] min-[700px]:h-dvh flex-col overflow-hidden bg-[var(--paper)]">
        <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
        <div className="flex shrink-0 gap-2 border-b border-[var(--line)] bg-white px-4 py-2.5 xl:hidden">
          <PanelButton current={panel} id="info" onSelect={setPanel}>
            {t("studio.panel.basics", "Pamati")}
          </PanelButton>
          <PanelButton current={panel} id="preview" onSelect={setPanel}>
            {t("studio.panel.preview", "Skats")}
          </PanelButton>
          <PanelButton current={panel} id="look" onSelect={setPanel}>
            {t("studio.panel.look", "Izskats")}
          </PanelButton>
        </div>

        <div
          className={`grid min-h-0 flex-1 xl:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)_minmax(17rem,22rem)]${
            blockDrawerOpen ? " studio-dim-surround" : ""
          }`}
        >
          <section
            className={`studio-column-info ${columnVisibility(panel, "info")} min-h-0 flex-col overflow-y-auto border-[var(--line)] bg-white xl:border-r`}
          >
            <div className="flex flex-col gap-2.5 px-3 py-4">
              {infoView ? (
                <InfoScreen
                  view={infoView}
                  page={page}
                  linkStatus={linkStatus}
                  handleDraft={handleDraft}
                  copied={copied}
                  publicPath={publicPath}
                  onBack={() => {
                    setBlockDraft(null);
                    setInfoView(null);
                  }}
                  onHandle={(value) => setHandleDraft(value)}
                  onCommit={commitHandle}
                  onCopy={() => void copyLink()}
                  update={update}
                  onBlockDraft={setBlockDraft}
                  onBlockDrawerOpen={setBlockDrawerOpen}
                  onError={(message) => notify(message, "error")}
                  onAnalyticsSaved={() =>
                    notify(t("studio.analytics.saved", "Analytics dati saglabāti."), "ok")
                  }
                  accountEmail={account?.email ?? null}
                  umamiAccess={umamiAccess}
                />
              ) : (
                <StudioMenu
                  title={t("studio.panel.basics", "Pamati")}
                  hint={t("studio.basics.hint", "Links, profils, sociālie un bloki. Velc Sociālos/Blokus, lai mainītu secību lapā.")}
                  items={[
                    {
                      id: "link",
                      title: t("studio.info.link", "Tavs links"),
                      hint: t("studio.info.link.hint", "Adrese, ko dalies bio."),
                      icon: <IconLink />,
                    },
                    {
                      id: "profile",
                      title: t("studio.info.profile", "Profils"),
                      hint: t("studio.info.profile.hint", "Vārds, tagline un bio."),
                      icon: <IconUser />,
                    },
                    {
                      id: "language",
                      title: t("studio.info.language", "Valoda"),
                      hint: pagePublicLanguageLabel(
                        page.publicLanguageCode,
                        languages,
                        visitorLanguageLabel,
                      ),
                      icon: <IconLanguage />,
                    },
                    {
                      id: "page-settings",
                      title: t("studio.info.settings", "Settings"),
                      hint: t("studio.info.settings.hint", "Links un lapas dzēšana."),
                      icon: <IconSettings />,
                    },
                    {
                      id: "contact",
                      title: t("studio.info.contact", "Contact"),
                      hint: t("studio.info.contact.hint", "Kontakta poga un VCF fails."),
                      icon: <IconContact />,
                      switch: {
                        checked: page.contactEnabled === true,
                        label: t("studio.contact.enabled", "Contact poga lapā"),
                        onChange: setContactEnabled,
                      },
                    },
                    {
                      id: "share",
                      title: t("studio.info.share", "Share"),
                      hint: t("studio.info.share.hint", "Share poga, avatars, saite un QR."),
                      icon: <IconShareOut />,
                      switch: {
                        checked: page.shareEnabled === true,
                        label: t("studio.share.enabled", "Share poga lapā"),
                        onChange: (shareEnabled) => update({ shareEnabled }),
                      },
                    },
                    ...(showUmamiBasics
                      ? [
                          {
                            id: "analytics" as const,
                            title: t("studio.info.analytics", "Analytics"),
                            hint: umamiShareReady
                              ? t("studio.info.analytics.stats_hint", "Skatīt lapas Umami statistiku.")
                              : t("studio.info.analytics.hint", "Umami Website ID un Share saite."),
                            icon: <IconAnalytics />,
                            planBadge: umamiPlanBadge,
                            planBadgeLabel: umamiPlanBadgeLabel,
                          },
                        ]
                      : []),
                    ...resolveStackOrder(page).map((id) =>
                      id === "socials"
                        ? {
                            id: "socials" as const,
                            title: t("studio.info.socials", "Sociālie"),
                            hint: t("studio.info.socials.hint", "Instagram, e-pasts un citi."),
                            icon: <IconShare />,
                            sortable: true,
                          }
                        : {
                            id: "blocks" as const,
                            title: t("studio.info.blocks", "Bloki"),
                            hint: t("studio.info.blocks.hint", "Saites un teksta kartītes."),
                            icon: <IconBlocks />,
                            sortable: true,
                          },
                    ),
                  ]}
                  onOpen={(id) => {
                    if (id === "language") {
                      setLanguageDrawerOpen(true);
                      return;
                    }
                    if (id === "page-settings") {
                      setPageSettingsOpen(true);
                      return;
                    }
                    setInfoView(id as InfoId);
                  }}
                  onReorder={(orderedIds) => {
                    const next = orderedIds.filter((id): id is StackSection => id === "socials" || id === "blocks");
                    if (next.length >= 2) update({ stackOrder: next });
                  }}
                />
              )}
              {(trailModuleEnabled || paidPlansModuleEnabled) && page.trialStartedAt && !infoView ? (
                <Suspense fallback={null}>
                  <StudioBillingSidebar
                    trialStartedAt={page.trialStartedAt}
                    trailModuleEnabled={trailModuleEnabled}
                    paidPlansModuleEnabled={paidPlansModuleEnabled}
                  />
                </Suspense>
              ) : paidPlansModuleEnabled && !infoView ? (
                <Suspense fallback={null}>
                  <StudioBillingSidebar
                    trialStartedAt={page.trialStartedAt ?? new Date(0).toISOString()}
                    trailModuleEnabled={false}
                    paidPlansModuleEnabled={paidPlansModuleEnabled}
                  />
                </Suspense>
              ) : null}
            </div>
          </section>

          <section
            className={`studio-column-preview ${columnVisibility(panel, "preview")} min-h-0 flex-col items-center justify-start overflow-y-auto bg-[#eef1f6] px-6 py-6${
              blockDrawerOpen ? " studio-preview-spotlight" : ""
            }`}
          >
            <DevicePreview
              page={previewPage}
              published={page.published}
              publicPath={publicPath}
              onTogglePublished={togglePublished}
            />
          </section>

          <section
            className={`studio-column-look ${columnVisibility(panel, "look")} min-h-0 flex-col overflow-y-auto border-[var(--line)] bg-white xl:border-l`}
          >
            <div className="flex flex-col gap-2.5 px-3 py-4">
              <LookColumn page={page} update={update} onError={(message) => notify(message, "error")} />
            </div>
          </section>
        </div>
        <StudioPageLanguageDrawer
          open={languageDrawerOpen}
          page={page}
          onClose={() => setLanguageDrawerOpen(false)}
          update={update}
        />
        <StudioPageSettingsDrawer
          open={pageSettingsOpen}
          page={page}
          onClose={() => setPageSettingsOpen(false)}
          update={update}
          onSavedLink={() => notify(t("studio.link_saved", "Links saglabāts."), "ok")}
          onError={(message) => notify(message, "error")}
        />
      </div>
    </AppShell>
  );
}

function InfoScreen({
  view,
  page,
  linkStatus,
  handleDraft,
  copied,
  publicPath,
  onBack,
  onHandle,
  onCommit,
  onCopy,
  update,
  onBlockDraft,
  onBlockDrawerOpen,
  onError,
  onAnalyticsSaved,
  accountEmail,
  umamiAccess,
}: {
  view: InfoId;
  page: Portfolio;
  linkStatus: { free: boolean; message: null | string };
  handleDraft: string | null;
  copied: boolean;
  publicPath: string;
  onBack: () => void;
  onHandle: (value: string) => void;
  onCommit: () => void;
  onCopy: () => void;
  update: (patch: Partial<Portfolio>) => void;
  onBlockDraft: (draft: PageBlock | null) => void;
  onBlockDrawerOpen: (open: boolean) => void;
  onError: (message: string) => void;
  onAnalyticsSaved: () => void;
  accountEmail: string | null;
  umamiAccess: { moduleEnabled: boolean; canUse: boolean; isPaid: boolean; paidPlansEnabled: boolean };
}) {
  const { t } = useTranslations();
  const title = {
    link: t("studio.info.link", "Tavs links"),
    profile: t("studio.info.profile", "Profils"),
    share: t("studio.info.share", "Share"),
    contact: t("studio.info.contact", "Contact"),
    analytics: t("studio.info.analytics", "Analytics"),
    socials: t("studio.info.socials", "Sociālie"),
    blocks: t("studio.info.blocks", "Bloki"),
  }[view];
  const paidLocked =
    umamiAccess.moduleEnabled && umamiAccess.isPaid && umamiAccess.paidPlansEnabled && !umamiAccess.canUse;
  return (
    <StudioScreen title={title} onBack={onBack}>
      {view === "link" ? (
        <StudioGroup>
          <FieldFrame label={t("onboarding.link.label", "Links")}>
            <span className="auth-handle" data-invalid={linkStatus.free ? undefined : "true"} data-valid={linkStatus.free ? "true" : undefined}>
              <span className="shrink-0 pl-3 text-sm text-[var(--muted)]">presh.me/</span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent px-2 text-[0.95rem] outline-none"
                value={handleDraft ?? page.handle}
                aria-invalid={!linkStatus.free}
                onChange={(event) => onHandle(event.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </span>
          </FieldFrame>
          {linkStatus.free ? null : (
            <p className="mt-2 text-sm text-[var(--stamp)]" role="status">
              {linkStatus.message}
            </p>
          )}
          <button type="button" className="btn-line mt-3 w-full" disabled={!linkStatus.free} onClick={onCommit}>
            {t("studio.save_link", "Saglabāt linku")}
          </button>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-quiet" onClick={onCopy}>
              {copied ? t("studio.copied", "Nokopēts") : t("studio.copy_link", "Kopēt linku")}
            </button>
            <Link href={publicPath} className="btn-quiet sm:hidden" target="_blank">
              {t("studio.view_page", "Skatīt lapu")}
            </Link>
          </div>
        </StudioGroup>
      ) : null}

      {view === "profile" ? (
        <StudioGroup>
          <FieldFrame label={t("common.name", "Vārds")}>
            <input
              className="auth-field"
              value={page.displayName}
              maxLength={60}
              placeholder={t("onboarding.name_ph", "Vārds Uzvārds")}
              onChange={(event) => update({ displayName: event.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("studio.profile.tagline", "Tagline")}>
            <input
              className="auth-field"
              value={page.tagline ?? ""}
              maxLength={80}
              placeholder={t("onboarding.tagline_ph", "Īss slogan zem vārda")}
              onChange={(event) => update({ tagline: event.target.value })}
            />
          </FieldFrame>
          <FieldFrame label={t("studio.profile.bio", "Bio")}>
            <textarea
              className="auth-area"
              value={page.bio}
              maxLength={160}
              placeholder={t("onboarding.bio_ph", "Īsi, ko dari")}
              onChange={(event) => update({ bio: event.target.value })}
            />
          </FieldFrame>
        </StudioGroup>
      ) : null}

      {view === "share" ? <StudioShareEditor page={page} update={update} onError={onError} /> : null}

      {view === "contact" ? (
        <StudioContactEditor page={page} update={update} onError={onError} accountEmail={accountEmail} />
      ) : null}

      {view === "analytics" ? (
        <StudioAnalyticsEditor
          page={page}
          update={update}
          onError={onError}
          onSaved={onAnalyticsSaved}
          paidLocked={paidLocked}
        />
      ) : null}

      {view === "socials" ? <SocialsEditor page={page} update={update} /> : null}

      {view === "blocks" ? (
        <BlocksEditor
          page={page}
          update={update}
          onPreviewDraft={onBlockDraft}
          onBlockDrawerOpen={onBlockDrawerOpen}
        />
      ) : null}
    </StudioScreen>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07.07l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5" />
      <path d="M14 11a5 5 0 0 0-7.07-.07L5.5 12.34a5 5 0 0 0 7.07 7.07L14 19" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function IconLanguage() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconContact() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

function IconShareOut() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="12" r="2.2" />
      <circle cx="17" cy="7" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
      <path d="m9 11 6-3M9 13l6 3" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M4 19V5M4 19h16" />
      <path d="M8 17V11M12 17V7M16 17v-4" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="17" cy="7" r="2.25" />
      <circle cx="17" cy="17" r="2.25" />
      <path d="m8 11 7-3M8 13l7 3" />
    </svg>
  );
}

function IconBlocks() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.25" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.25" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.25" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.25" />
    </svg>
  );
}

function columnVisibility(current: Panel, id: Panel) {
  return current === id ? "flex" : "hidden xl:flex";
}

function PanelButton({
  current,
  id,
  onSelect,
  className = "",
  children,
}: {
  current: Panel;
  id: Panel;
  onSelect: (id: Panel) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${current === id ? "btn-ink" : "btn-line"} ${className}`}
      onClick={() => onSelect(id)}
      aria-pressed={current === id}
    >
      {children}
    </button>
  );
}

