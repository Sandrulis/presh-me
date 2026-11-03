import { buildEmailHtml, buildNotificationEmailHtml } from "@/app/lib/email/build-email-html";
import {
  FALLBACK_TEMPLATES,
  TEMPLATE_KEYS,
  fallbackButton,
  fallbackFooter,
  fallbackFor,
  isSimpleEmailKind,
  type EmailTemplateKind,
} from "@/app/lib/email/templates";
import { interpolate } from "@/app/lib/i18n/interpolate";
import { DEFAULT_LANGUAGE, isLanguageCode } from "@/app/lib/i18n/language";
import { sendResendEmail } from "@/app/lib/integrations/resend/client";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type EmailTemplateParams = Record<string, string>;

async function resolveEmailLanguageCode(languageCode?: string | null): Promise<string> {
  const requested = languageCode?.trim().toLowerCase() ?? "";
  if (requested && isLanguageCode(requested)) return requested;
  if (!isSupabaseAdminConfigured()) return DEFAULT_LANGUAGE;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_languages")
      .select("code")
      .eq("is_default", true)
      .eq("is_active", true)
      .maybeSingle();
    if (data?.code && isLanguageCode(data.code)) return data.code;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANGUAGE;
}

async function loadEmailDictionary(languageCode: string) {
  if (!isSupabaseAdminConfigured()) return {};
  try {
    const admin = createAdminClient();
    const { data: languages } = await admin
      .from("site_languages")
      .select("code, is_default")
      .eq("is_active", true);
    const defaultCode =
      languages?.find((row) => row.is_default)?.code ?? DEFAULT_LANGUAGE;
    const { data } = await admin.from("site_translations").select("translation_key, values");
    return Object.fromEntries(
      ((data ?? []) as { translation_key: string; values: Record<string, unknown> | null }[])
        .map((row) => {
          const values =
            row.values && typeof row.values === "object" && !Array.isArray(row.values)
              ? row.values
              : {};
          const active =
            typeof values[languageCode] === "string" ? String(values[languageCode]).trim() : "";
          const fallback =
            typeof values[defaultCode] === "string" ? String(values[defaultCode]).trim() : "";
          return [row.translation_key, active || fallback || ""];
        })
        .filter(([, value]) => value.length > 0),
    );
  } catch {
    return {};
  }
}

async function getSystemName() {
  if (!isSupabaseAdminConfigured()) return "Presh";
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_settings")
      .select("system_name")
      .eq("id", 1)
      .maybeSingle();
    return (data?.system_name as string | undefined)?.trim() || "Presh";
  } catch {
    return "Presh";
  }
}

export async function sendTemplatedEmail(input: {
  kind: EmailTemplateKind;
  to: string;
  languageCode?: string | null;
  params: EmailTemplateParams;
  heading?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const email = input.to.trim().toLowerCase();
    if (!email) return { ok: false, error: "errors.email_invalid" };
    const link = input.params.link?.trim() ?? "";
    if (!link) return { ok: false, error: "errors.email_link_missing" };

    const lang = await resolveEmailLanguageCode(input.languageCode);
    const [systemName, dictionary] = await Promise.all([getSystemName(), loadEmailDictionary(lang)]);
    const keys = TEMPLATE_KEYS[input.kind];
    const params = { system: systemName, ...input.params, link };

    const subject = interpolate(
      dictionary[keys.subjectKey] || fallbackFor(input.kind, "subject", lang),
      params,
    );
    const bodyText = interpolate(
      dictionary[keys.bodyKey] || fallbackFor(input.kind, "body", lang),
      params,
    );
    const buttonLabel = interpolate(
      dictionary[keys.buttonKey] || fallbackButton(input.kind, lang),
      params,
    );
    const footerHint = interpolate(
      dictionary["email.footer_hint"] || fallbackFooter(lang),
      params,
    );
    const heading =
      input.heading?.trim() ||
      subject.replace(/\s*[—–-]\s*.*$/, "").trim() ||
      FALLBACK_TEMPLATES[input.kind].subject.lv;

    const html = buildEmailHtml({
      systemName,
      heading,
      bodyText,
      buttonLabel,
      actionLink: link,
      footerHint,
    });

    const sent = await sendResendEmail({
      to: email,
      subject,
      html,
      text: `${bodyText}\n\n${link}`,
      fromName: systemName,
    });
    if (!sent.ok) {
      console.error("sendTemplatedEmail failed", sent.error);
      return sent;
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "sendTemplatedEmail failed",
      error instanceof Error ? error.message : error,
    );
    return { ok: false, error: "errors.integrations_resend_send_failed" };
  }
}

export async function sendNotificationEmail(input: {
  kind: Extract<
    EmailTemplateKind,
    "booking_owner" | "booking_guest" | "account_deletion_completed" | "account_deletion_cancelled"
  >;
  to: string;
  languageCode?: string | null;
  params: EmailTemplateParams;
  details?: { label: string; value: string }[];
  heading?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSimpleEmailKind(input.kind)) {
    return { ok: false, error: "errors.email_template_invalid" };
  }
  try {
    const email = input.to.trim().toLowerCase();
    if (!email) return { ok: false, error: "errors.email_invalid" };

    const lang = await resolveEmailLanguageCode(input.languageCode);
    const [systemName, dictionary] = await Promise.all([getSystemName(), loadEmailDictionary(lang)]);
    const keys = TEMPLATE_KEYS[input.kind];
    const params = { system: systemName, ...input.params };

    const subject = interpolate(
      dictionary[keys.subjectKey] || fallbackFor(input.kind, "subject", lang),
      params,
    );
    const bodyText = interpolate(
      dictionary[keys.bodyKey] || fallbackFor(input.kind, "body", lang),
      params,
    );
    const heading =
      input.heading?.trim() ||
      subject.replace(/\s*[—–-]\s*.*$/, "").trim() ||
      FALLBACK_TEMPLATES[input.kind].subject.lv;

    const html = buildNotificationEmailHtml({
      systemName,
      heading,
      bodyText,
      details: input.details,
      accentColor: "#2f9e57",
    });

    const sent = await sendResendEmail({
      to: email,
      subject,
      html,
      text: bodyText,
      fromName: systemName,
    });
    if (!sent.ok) {
      console.error("sendNotificationEmail failed", sent.error);
      return sent;
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "sendNotificationEmail failed",
      error instanceof Error ? error.message : error,
    );
    return { ok: false, error: "errors.integrations_resend_send_failed" };
  }
}
