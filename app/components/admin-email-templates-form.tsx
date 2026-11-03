"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { buildEmailHtml, buildNotificationEmailHtml } from "@/app/lib/email/build-email-html";
import { saveEmailTemplateDrafts } from "@/app/lib/email/templates-server";
import {
  fallbackFooter,
  isAccountDeletionNotificationKind,
  isBookingEmailKind,
  isSimpleEmailKind,
  isSubscriptionEmailKind,
  type EmailTemplateDraft,
  type EmailTemplateKind,
} from "@/app/lib/email/templates";
import { interpolate } from "@/app/lib/i18n/interpolate";

const TEMPLATE_LABELS: Record<EmailTemplateKind, { key: string; fallback: string }> = {
  signup: { key: "admin.email_templates.kind.signup", fallback: "Reģistrācijas apstiprinājums" },
  password_reset: {
    key: "admin.email_templates.kind.password_reset",
    fallback: "Aizmirsa paroli",
  },
  email_change: {
    key: "admin.email_templates.kind.email_change",
    fallback: "E-pasta maiņa",
  },
  booking_owner: {
    key: "admin.email_templates.kind.booking_owner",
    fallback: "Booking — īpašniekam",
  },
  booking_guest: {
    key: "admin.email_templates.kind.booking_guest",
    fallback: "Booking — pieteicējam",
  },
  account_deletion_confirm: {
    key: "admin.email_templates.kind.account_deletion_confirm",
    fallback: "Konta dzēšanas apstiprinājums",
  },
  account_deletion_completed: {
    key: "admin.email_templates.kind.account_deletion_completed",
    fallback: "Konts dzēsts pēc termiņa",
  },
  account_deletion_cancelled: {
    key: "admin.email_templates.kind.account_deletion_cancelled",
    fallback: "Konta dzēšana atcelta",
  },
  subscription_purchased: {
    key: "admin.email_templates.kind.subscription_purchased",
    fallback: "Abonements — jauns pirkums",
  },
  subscription_plan_upgraded: {
    key: "admin.email_templates.kind.subscription_plan_upgraded",
    fallback: "Abonements — plāna paaugstināšana",
  },
  subscription_plan_downgraded: {
    key: "admin.email_templates.kind.subscription_plan_downgraded",
    fallback: "Abonements — plāna pazemināšana",
  },
};

const PREVIEW_PARAMS = {
  name: "Lietotājs",
  system: "Presh",
  link: "https://example.com/vards",
  page: "Mans profils",
  date: "2026. gada 15. marts",
  time: "10:00",
  email: "klients@example.com",
  comment: "Vēlos īsu konsultāciju.",
  comment_line: "Tavs komentārs: Vēlos īsu konsultāciju.",
  plan: "Pro",
  previous_plan: "Basic",
  price: "€ 9.99",
  period: "mēnesī",
  effective_date: "05.12.2026.",
  days: "30",
};

function cloneTemplates(templates: EmailTemplateDraft[]) {
  return templates.map((template) => ({
    ...template,
    subjects: { ...template.subjects },
    bodies: { ...template.bodies },
    buttons: { ...template.buttons },
  }));
}

export function AdminEmailTemplatesForm({
  resendEnabled,
  initialTemplates,
  languages,
}: {
  resendEnabled: boolean;
  initialTemplates: EmailTemplateDraft[];
  languages: { code: string; name: string; isDefault?: boolean }[];
}) {
  const { t } = useTranslations();
  const { notices, notify, dismissNotice } = useNotices();
  const [templates, setTemplates] = useState(() => cloneTemplates(initialTemplates));
  const [saved, setSaved] = useState(() => cloneTemplates(initialTemplates));
  const [kind, setKind] = useState<EmailTemplateKind>(initialTemplates[0]?.kind ?? "signup");
  const [lang, setLang] = useState(
    () => languages.find((item) => item.isDefault)?.code ?? languages[0]?.code ?? "lv",
  );
  const [pending, startTransition] = useTransition();

  const current = templates.find((item) => item.kind === kind) ?? templates[0];
  const dirty = JSON.stringify(templates) !== JSON.stringify(saved);

  const previewHtml = useMemo(() => {
    if (!current) return "";
    const subject = interpolate(current.subjects[lang] || "", PREVIEW_PARAMS);
    const body = interpolate(current.bodies[lang] || "", PREVIEW_PARAMS);
    const heading = subject.replace(/\s*[—–-]\s*.*$/, "").trim() || subject;
    if (isSimpleEmailKind(current.kind)) {
      const details = isBookingEmailKind(current.kind)
        ? [
            { label: lang === "lv" ? "Datums" : "Date", value: PREVIEW_PARAMS.date },
            { label: lang === "lv" ? "Laiks" : "Time", value: PREVIEW_PARAMS.time },
            ...(current.kind === "booking_owner"
              ? [{ label: lang === "lv" ? "E-pasts" : "Email", value: PREVIEW_PARAMS.email }]
              : []),
            { label: lang === "lv" ? "Komentārs" : "Comment", value: PREVIEW_PARAMS.comment },
          ]
        : [];
      return buildNotificationEmailHtml({
        systemName: PREVIEW_PARAMS.system,
        heading,
        bodyText: body,
        accentColor: "#2f9e57",
        details,
      });
    }
    const button = interpolate(current.buttons[lang] || "", PREVIEW_PARAMS);
    return buildEmailHtml({
      systemName: PREVIEW_PARAMS.system,
      heading,
      bodyText: body,
      buttonLabel: button,
      actionLink: PREVIEW_PARAMS.link,
      footerHint: fallbackFooter(lang),
    });
  }, [current, lang]);

  function patch(field: "subjects" | "bodies" | "buttons", value: string) {
    setTemplates((rows) =>
      rows.map((row) =>
        row.kind === kind
          ? { ...row, [field]: { ...row[field], [lang]: value } }
          : row,
      ),
    );
  }

  function save() {
    startTransition(async () => {
      const result = await saveEmailTemplateDrafts(templates);
      if (!result.ok) {
        notify(result.message, "error");
        return;
      }
      setSaved(cloneTemplates(templates));
      notify(t("admin.email_templates.saved", "E-pasta dizaini saglabāti."), "ok");
    });
  }

  return (
    <div className="space-y-4">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      {!resendEnabled ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t(
            "admin.email_templates.resend_off",
            "Resend nav ieslēgts — e-pasti netiks sūtīti, līdz konfigurēsi integrāciju.",
          )}{" "}
          <Link href="/admin/integrations" className="underline">
            {t("nav.admin", "Administrācija")} → {t("admin.nav.integrations", "Integrācijas")}
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {templates.map((item) => (
          <button
            key={item.kind}
            type="button"
            onClick={() => setKind(item.kind)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              item.kind === kind
                ? "bg-[var(--ink)] text-white"
                : "bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {t(TEMPLATE_LABELS[item.kind].key, TEMPLATE_LABELS[item.kind].fallback)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-5">
          <label className="block">
            <span className="auth-label">{t("settings.language.title", "Valoda")}</span>
            <select
              className="auth-field"
              value={lang}
              onChange={(event) => setLang(event.target.value)}
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="auth-label">{t("admin.email_templates.subject", "Temats")}</span>
            <input
              className="auth-field"
              value={current?.subjects[lang] ?? ""}
              onChange={(event) => patch("subjects", event.target.value)}
            />
          </label>
          <label className="block">
            <span className="auth-label">{t("admin.email_templates.body", "Teksts")}</span>
            <textarea
              className="auth-field min-h-40"
              value={current?.bodies[lang] ?? ""}
              onChange={(event) => patch("bodies", event.target.value)}
            />
            {current && isBookingEmailKind(current.kind) ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t(
                  "admin.email_templates.placeholders_booking",
                  "Placeholders: {page}, {date}, {time}, {email}, {comment}, {comment_line}, {system}",
                )}
              </p>
            ) : null}
            {current && isAccountDeletionNotificationKind(current.kind) ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t(
                  "admin.email_templates.placeholders_account_deletion",
                  "Placeholders: {name}, {days} (tikai „Konts dzēsts”), {system}",
                )}
              </p>
            ) : null}
          </label>
          {current && !isSimpleEmailKind(current.kind) ? (
            <label className="block">
              <span className="auth-label">{t("admin.email_templates.button", "Pogas teksts")}</span>
              <input
                className="auth-field"
                value={current?.buttons[lang] ?? ""}
                onChange={(event) => patch("buttons", event.target.value)}
              />
              {isSubscriptionEmailKind(current.kind) ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {t(
                    "admin.email_templates.placeholders_subscription",
                    "Placeholders: {name}, {plan}, {previous_plan}, {price}, {period}, {effective_date}, {link}, {system}",
                  )}
                </p>
              ) : null}
            </label>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              {t(
                isAccountDeletionNotificationKind(current?.kind ?? "signup")
                  ? "admin.email_templates.no_button_text_only"
                  : "admin.email_templates.no_button",
                isAccountDeletionNotificationKind(current?.kind ?? "signup")
                  ? "Šim dizainam nav CTA pogas — tikai teksts."
                  : "Šim dizainam nav CTA pogas — tikai teksts un detaļu bloks.",
              )}
            </p>
          )}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              className="btn-ink"
              disabled={!dirty || pending}
              onClick={save}
            >
              {pending ? t("common.loading", "Ielādē...") : t("actions.save", "Saglabāt")}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <p className="border-b border-[var(--line)] px-4 py-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {t("admin.email_templates.preview", "Priekšskatījums")}
          </p>
          <iframe
            title="email-preview"
            sandbox=""
            srcDoc={previewHtml}
            className="h-[32rem] w-full bg-[#f4f4f5]"
          />
        </div>
      </div>
    </div>
  );
}
