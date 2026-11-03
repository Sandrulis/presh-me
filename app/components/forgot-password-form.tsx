"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/app/components/auth-shell";
import { EmailSentModal } from "@/app/components/email-sent-modal";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { requestPasswordResetAction } from "@/app/lib/auth/register-action";
import { useAuthTurnstile } from "@/app/lib/auth/use-auth-turnstile";
import { createClient } from "@/app/lib/supabase/client";

export function ForgotPasswordForm() {
  const router = useRouter();
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [sentOpen, setSentOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { notices, notify, dismissNotice } = useNotices();
  const turnstile = useAuthTurnstile();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const gate = await turnstile.ensureVerified();
    if (!gate.ok) {
      setPending(false);
      notify(gate.message, "error");
      return;
    }
    const viaResend = await requestPasswordResetAction(email);
    if (!viaResend.ok) {
      setPending(false);
      notify(viaResend.message, "error");
      return;
    }
    if (viaResend.mode === "resend") {
      setPending(false);
      setSentOpen(true);
      return;
    }

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/update-password")}`,
    });
    setPending(false);
    if (resetError) {
      notify(resetError.message, "error");
      return;
    }
    setSentOpen(true);
  }

  return (
    <AuthShell
      kicker={t("auth.forgot.kicker", "Konts")}
      title={t("auth.forgot.title", "Aizmirsi paroli?")}
      subtitle={t(
        "auth.forgot.subtitle",
        "Ievadi e-pastu. Nosūtīsim saiti, ar kuru apstiprināsi, ka konts ir tavs.",
      )}
    >
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <label className="block">
          <span className="auth-label">{t("common.email", "E-pasts")}</span>
          <input
            className="auth-field"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("common.email_ph", "vards@epasts.lv")}
            autoComplete="email"
            required
          />
        </label>
        {turnstile.field}
        <button type="submit" className="btn-auth" disabled={pending || sentOpen}>
          {pending
            ? t("auth.forgot.pending", "Sūta...")
            : t("auth.forgot.submit", "Nosūtīt saiti")}
        </button>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="underline">
            {t("auth.forgot.back", "Atpakaļ")}
          </Link>
        </p>
      </form>
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <EmailSentModal
        open={sentOpen}
        title={t("auth.forgot.sent_modal.title", "Pārbaudi e-pastu")}
        body={t(
          "auth.forgot.sent",
          "Ja {email} ir reģistrēts, saite ir ceļā. Atver to e-pastā un iestati jaunu paroli.",
        )}
        email={email.trim()}
        actionLabel={t("auth.forgot.back_login", "Atpakaļ pie pieslēgšanās")}
        onLeave={() => router.push("/login")}
      />
    </AuthShell>
  );
}
