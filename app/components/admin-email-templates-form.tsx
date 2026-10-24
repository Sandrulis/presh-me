"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { buildEmailHtml } from "@/app/lib/email/build-email-html";
import { saveEmailTemplateDrafts } from "@/app/lib/email/templates-server";
import {
  fallbackFooter,
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
};

const PREVIEW_PARAMS = {
  name: "Lietotājs",
  system: "Presh",
  link: "https://example.com/auth/confirm?token_hash=…&type=signup",
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
    const button = interpolate(current.buttons[lang] || "", PREVIEW_PARAMS);
    return buildEmailHtml({
      systemName: PREVIEW_PARAMS.system,
      heading: subject.replace(/\s*[—–-]\s*.*$/, "").trim() || subject,
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
          </label>
          <label className="block">
            <span className="auth-label">{t("admin.email_templates.button", "Pogas teksts")}</span>
            <input
              className="auth-field"
              value={current?.buttons[lang] ?? ""}
              onChange={(event) => patch("buttons", event.target.value)}
            />
          </label>
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
