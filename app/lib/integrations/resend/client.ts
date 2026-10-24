import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export async function getResendCredentials(): Promise<{
  fromEmail: string;
  apiKey: string;
  replyToEmail: string;
} | null> {
  if (!isSupabaseAdminConfigured()) {
    const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
    const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
    if (!from || !apiKey) return null;
    return { fromEmail: from, apiKey, replyToEmail: "" };
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_integrations")
      .select("client_id, client_secret, configured_account_email, is_configured, is_enabled")
      .eq("integration_key", "resend")
      .maybeSingle();
    if (!data?.is_enabled || !data.is_configured) return null;
    const fromEmail = (data.client_id ?? "").trim() || process.env.RESEND_FROM_EMAIL?.trim() || "";
    let storedKey = (data.client_secret ?? "").trim();
    if (storedKey) {
      try {
        const { decryptSecret } = await import("@/app/lib/security/secrets");
        storedKey = decryptSecret(storedKey);
      } catch {
        /* plaintext legacy */
      }
    }
    const apiKey = storedKey || process.env.RESEND_API_KEY?.trim() || "";
    if (!fromEmail || !apiKey) return null;
    return {
      fromEmail,
      apiKey,
      replyToEmail: (data.configured_account_email ?? "").trim(),
    };
  } catch {
    return null;
  }
}

export async function isResendEnabled() {
  return (await getResendCredentials()) !== null;
}

export async function sendResendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const credentials = await getResendCredentials();
  if (!credentials) {
    return { ok: false, error: "errors.integrations_resend_not_enabled" };
  }

  const from = input.fromName?.trim()
    ? `${input.fromName.trim().replace(/[<>"]/g, "")} <${credentials.fromEmail}>`
    : credentials.fromEmail;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        ...(credentials.replyToEmail ? { reply_to: credentials.replyToEmail } : {}),
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("Resend send failed:", response.status, body);
      return { ok: false, error: "errors.integrations_resend_send_failed" };
    }

    const payload = (await response.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: typeof payload?.id === "string" ? payload.id : undefined };
  } catch (error) {
    console.error("Resend send failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "errors.integrations_resend_send_failed" };
  }
}
