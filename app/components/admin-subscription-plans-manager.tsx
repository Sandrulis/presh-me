"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ConfirmDialog,
  IconActionButton,
  IconPen,
  IconTrash,
  ToggleSwitch,
} from "@/app/components/admin-ui";
import { AdminPage } from "@/app/components/admin-page";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import { KNOWN_MODULE_LABEL_KEYS, listFrontendModules, type SiteFrontendModule } from "@/app/lib/site-admin/modules";
import {
  deleteSubscriptionPlan,
  listSubscriptionPlans,
  saveSubscriptionPlan,
  setSubscriptionPlanActive,
  type SubscriptionPlan,
} from "@/app/lib/site-admin/subscription-plans";
import { listSiteLanguages, refreshSiteAdmin, subscribeSiteAdmin } from "@/app/lib/site-admin/store";

function formatPlanPrice(amount: number) {
  const fixed = amount.toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const withSpaces = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `€ ${withSpaces}.${fraction}`;
}

function planTitle(plan: SubscriptionPlan, languages: ReturnType<typeof listSiteLanguages>) {
  const preferred =
    languages.find((item) => item.isDefault)?.code ??
    languages.find((item) => item.isActive)?.code ??
    "lv";
  return plan.names[preferred]?.trim() || plan.names.en?.trim() || plan.planKey;
}

type Draft = {
  id?: string;
  planKey: string;
  priceAmount: string;
  isActive: boolean;
  names: Record<string, string>;
  moduleKeys: Set<string>;
};

function emptyDraft(): Draft {
  return {
    planKey: "",
    priceAmount: "0",
    isActive: true,
    names: {},
    moduleKeys: new Set(),
  };
}

function draftFromPlan(plan: SubscriptionPlan): Draft {
  return {
    id: plan.id,
    planKey: plan.planKey,
    priceAmount: String(plan.priceAmount),
    isActive: plan.isActive,
    names: { ...plan.names },
    moduleKeys: new Set(plan.moduleKeys),
  };
}

export function AdminSubscriptionPlansManager() {
  const { t } = useTranslations();
  const languages = useSyncExternalStore(subscribeSiteAdmin, listSiteLanguages, listSiteLanguages);
  const { notices, notify, dismissNotice } = useNotices();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [modules, setModules] = useState<SiteFrontendModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);

  const paidModules = useMemo(() => modules.filter((item) => item.isPaid), [modules]);
  const activeLanguages = useMemo(() => languages.filter((item) => item.isActive), [languages]);

  async function reload() {
    const [nextPlans, nextModules] = await Promise.all([listSubscriptionPlans(), listFrontendModules()]);
    setPlans(nextPlans);
    setModules(nextModules);
  }

  useEffect(() => {
    void refreshSiteAdmin();
    void (async () => {
      try {
        await reload();
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : t("admin.subscription_plans.load_failed", "Neizdevās ielādēt abonementu plānus."),
          "error",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [notify, t]);

  function openCreate() {
    setDraft(emptyDraft());
    setDrawerOpen(true);
  }

  function openEdit(plan: SubscriptionPlan) {
    setDraft(draftFromPlan(plan));
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (busy) return;
    setDrawerOpen(false);
    setDraft(emptyDraft());
  }

  async function submitDraft() {
    const priceAmount = Number.parseFloat(draft.priceAmount.replace(",", "."));
    setBusy(true);
    try {
      const saved = await saveSubscriptionPlan({
        id: draft.id,
        planKey: draft.planKey,
        priceAmount,
        isActive: draft.isActive,
        names: draft.names,
        moduleKeys: [...draft.moduleKeys],
      });
      setPlans((current) => {
        const rest = current.filter((item) => item.id !== saved.id);
        return [...rest, saved].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.planKey.localeCompare(b.planKey),
        );
      });
      closeDrawer();
      notify(t("admin.subscription_plans.saved", "Plāns saglabāts."), "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.subscription_plans.save_failed", "Neizdevās saglabāt."),
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusy(true);
    try {
      await deleteSubscriptionPlan(target.id);
      setPlans((current) => current.filter((item) => item.id !== target.id));
      notify(t("admin.subscription_plans.deleted", "Plāns dzēsts."), "ok");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("admin.subscription_plans.delete_failed", "Neizdevās dzēst."),
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage
      titleKey="admin.nav.subscription_plans"
      titleFallback="Abonementu plāni"
      wide
      actions={
        <button type="button" className="btn-ink shrink-0" onClick={openCreate}>
          {t("admin.subscription_plans.add", "+ Pievienot plānu")}
        </button>
      }
    >
      <div className="space-y-4">
        <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
        <p className="text-sm text-[var(--muted)]">
          {t(
            "admin.subscription_plans.hint",
            "Definē cenu, nosaukumus katrā valodā un kuri maksas moduļi iekļauti plānā.",
          )}
        </p>

        {loading ? (
          <p className="text-sm text-[var(--muted)]">
            {t("admin.subscription_plans.loading", "Ielādē plānus...")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[var(--paper)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-3">{t("admin.subscription_plans.col.name", "Nosaukums")}</th>
                    <th className="px-5 py-3">{t("admin.subscription_plans.col.key", "Atslēga")}</th>
                    <th className="px-5 py-3">{t("admin.subscription_plans.col.price", "Cena")}</th>
                    <th className="px-5 py-3">{t("admin.subscription_plans.col.modules", "Moduļi")}</th>
                    <th className="px-5 py-3">{t("admin.subscription_plans.col.active", "Aktīvs")}</th>
                    <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="px-5 py-4 font-semibold text-[var(--ink)]">{planTitle(plan, languages)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-[var(--muted)]">{plan.planKey}</td>
                      <td className="px-5 py-4 tabular-nums">{formatPlanPrice(plan.priceAmount)}</td>
                      <td className="px-5 py-4 text-[var(--muted)]">{plan.moduleKeys.length}</td>
                      <td className="px-5 py-4">
                        <ToggleSwitch
                          checked={plan.isActive}
                          disabled={busy}
                          label={t("admin.subscription_plans.active_label", "Plāns {key} aktīvs", {
                            key: plan.planKey,
                          })}
                          onChange={(next) => {
                            void (async () => {
                              setBusy(true);
                              try {
                                await setSubscriptionPlanActive(plan.id, next);
                                setPlans((current) =>
                                  current.map((item) =>
                                    item.id === plan.id ? { ...item, isActive: next } : item,
                                  ),
                                );
                              } catch (error) {
                                notify(
                                  error instanceof Error ? error.message : t("actions.save", "Saglabāt"),
                                  "error",
                                );
                              } finally {
                                setBusy(false);
                              }
                            })();
                          }}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <IconActionButton
                            label={t("actions.edit", "Labot")}
                            onClick={() => openEdit(plan)}
                          >
                            <IconPen />
                          </IconActionButton>
                          <IconActionButton
                            label={t("actions.delete", "Dzēst")}
                            variant="danger"
                            onClick={() => setDeleteTarget(plan)}
                          >
                            <IconTrash />
                          </IconActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[var(--muted)]">
                        {t("admin.subscription_plans.empty", "Nav neviena plāna.")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <SideDrawer
          open={drawerOpen}
          side="right"
          title={
            draft.id
              ? t("admin.subscription_plans.edit_title", "Labot plānu")
              : t("admin.subscription_plans.new_title", "Jauns plāns")
          }
          onClose={closeDrawer}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-line" disabled={busy} onClick={closeDrawer}>
                {t("actions.cancel", "Atcelt")}
              </button>
              <button type="button" className="btn-ink" disabled={busy} onClick={() => void submitDraft()}>
                {busy ? t("common.loading", "Ielādē...") : t("actions.save", "Saglabāt")}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="auth-label">{t("admin.subscription_plans.key_label", "Plāna atslēga")}</span>
              <input
                className="auth-field font-mono text-sm"
                value={draft.planKey}
                disabled={busy || Boolean(draft.id)}
                onChange={(event) => setDraft((current) => ({ ...current, planKey: event.target.value }))}
                placeholder="starter"
                pattern="[a-z0-9._:-]+"
                required
              />
            </label>
            <label className="block">
              <span className="auth-label">{t("admin.subscription_plans.price_label", "Cena (EUR)")}</span>
              <input
                className="auth-field tabular-nums"
                inputMode="decimal"
                value={draft.priceAmount}
                disabled={busy}
                onChange={(event) => setDraft((current) => ({ ...current, priceAmount: event.target.value }))}
                required
              />
            </label>
            <label className="flex items-center gap-3">
              <ToggleSwitch
                checked={draft.isActive}
                disabled={busy}
                label={t("admin.subscription_plans.draft_active", "Plāns aktīvs")}
                onChange={(checked) => setDraft((current) => ({ ...current, isActive: checked }))}
              />
              <span className="text-sm text-[var(--muted)]">
                {t("admin.subscription_plans.draft_active_hint", "Neaktīvs plāns netiek piedāvāts lietotājiem.")}
              </span>
            </label>

            <div>
              <p className="auth-label">{t("admin.subscription_plans.names_title", "Nosaukumi")}</p>
              <div className="mt-2 space-y-3">
                {activeLanguages.map((language) => (
                  <label key={language.code} className="block">
                    <span className="text-xs font-medium text-[var(--muted)]">
                      {language.name} ({language.code})
                    </span>
                    <input
                      className="auth-field mt-1"
                      value={draft.names[language.code] ?? ""}
                      disabled={busy}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          names: { ...current.names, [language.code]: event.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="auth-label">{t("admin.subscription_plans.modules_title", "Maksas moduļi plānā")}</p>
              <p className="auth-hint">
                {t(
                  "admin.subscription_plans.modules_hint",
                  "Atzīmē moduļus, kas iekļauti šajā plānā. Tikai moduļi ar ieslēgtu maksas ikonu.",
                )}
              </p>
              {paidModules.length === 0 ? (
                <p className="mt-2 text-sm text-amber-700">
                  {t("admin.subscription_plans.no_paid_modules", "Nav maksas moduļu — ieslēdz maksas ikonu moduļos.")}
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {paidModules.map((module) => {
                    const labelKey = KNOWN_MODULE_LABEL_KEYS[module.moduleKey];
                    const label = labelKey ? t(labelKey, module.moduleKey) : module.moduleKey;
                    const checked = draft.moduleKeys.has(module.moduleKey);
                    return (
                      <li key={module.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2">
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={checked}
                            disabled={busy}
                            onChange={() =>
                              setDraft((current) => {
                                const next = new Set(current.moduleKeys);
                                if (next.has(module.moduleKey)) next.delete(module.moduleKey);
                                else next.add(module.moduleKey);
                                return { ...current, moduleKeys: next };
                              })
                            }
                          />
                          <span className="text-sm">{label}</span>
                          <span className="font-mono text-xs text-[var(--muted)]">{module.moduleKey}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </SideDrawer>

        <ConfirmDialog
          open={deleteTarget !== null}
          title={t("admin.subscription_plans.delete_title", "Dzēst plānu?")}
          description={
            deleteTarget
              ? t("admin.subscription_plans.delete_body", "Vai dzēst plānu {key}?", {
                  key: deleteTarget.planKey,
                })
              : ""
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      </div>
    </AdminPage>
  );
}
