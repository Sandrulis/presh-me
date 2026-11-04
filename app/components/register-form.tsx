"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/app/components/auth-shell";
import { EmailSentModal } from "@/app/components/email-sent-modal";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { GoogleSignInButton } from "@/app/components/google-sign-in-button";
import { PasswordInput } from "@/app/components/password-input";
import { useTranslations } from "@/app/components/translations-provider";
import { registerAccountAction } from "@/app/lib/auth/register-action";
import { useAuthTurnstile } from "@/app/lib/auth/use-auth-turnstile";
import { normalizeHandle } from "@/app/lib/handles";
import { stashLandingCheckoutPlan } from "@/app/lib/billing/pending-landing-plan";
import { registerAccount } from "@/app/lib/store";

/** Avoid double toast from React Strict Mode / Suspense remount with the same ?error=. */
let registerAuthErrorShown: string | null = null;

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useTranslations();
  const preset = normalizeHandle(params.get("handle") ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { notices, notify, dismissNotice } = useNotices();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const turnstile = useAuthTurnstile();

  const authError = params.get("error");
  useEffect(() => {
    const plan = params.get("plan")?.trim().toLowerCase() ?? "";
    if (plan) stashLandingCheckoutPlan(plan);
  }, [params]);

  useEffect(() => {
    if (!authError) {
      registerAuthErrorShown = null;
      return;
    }
    if (registerAuthErrorShown === authError) return;
    registerAuthErrorShown = authError;
    if (authError === "blocked") {
      notify(t("auth.blocked", "Pieeja sistēmai ar šo e-pastu ir liegta."), "error");
    } else if (authError === "google") {
      notify(t("auth.register.google_error", "Neizdevās reģistrēties ar Google. Mēģini vēlreiz."), "error");
    }
    const next = preset ? `/register?handle=${encodeURIComponent(preset)}` : "/register";
    router.replace(next, { scroll: false });
  }, [authError, notify, preset, router, t]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const gate = await turnstile.ensureVerified();
    if (!gate.ok) {
      setPending(false);
      notify(gate.message, "error");
      return;
    }
    const viaResend = await registerAccountAction({
      name,
      email,
      password,
      handle: preset,
    });
    if (viaResend.ok && viaResend.mode === "confirm") {
      setPending(false);
      setConfirmEmail(email.trim());
      setConfirmOpen(true);
      return;
    }
    if (viaResend.ok === false && viaResend.message !== "__use_client_signup__") {
      setPending(false);
      notify(viaResend.message, "error");
      return;
    }

    const result = await registerAccount({ name, email, password, handle: preset });
    setPending(false);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    router.push("/start");
  }

  return (
    <AuthShell
      kicker={t("auth.register.kicker", "Jauna lapa")}
      title={t("auth.register.title", "Izveido kontu.")}
      subtitle={t("auth.register.subtitle", "Vārds, e-pasts un parole.")}
    >
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <label className="block">
          <span className="auth-label">{t("common.name", "Vārds")}</span>
          <input
            className="auth-field"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("onboarding.name_ph", "Vārds Uzvārds")}
            autoComplete="name"
            required
          />
        </label>
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
        <label className="block">
          <span className="auth-label">{t("common.password", "Parole")}</span>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <span className="auth-hint">{t("auth.register.password_hint", "Vismaz 8 simboli.")}</span>
        </label>
        <p className="text-center text-sm leading-relaxed text-[var(--muted)]">
          {t("auth.register.terms_prefix", "Pievienojoties, tu piekrīti")}{" "}
          <Link href="/terms" className="underline">
            {t("auth.register.terms", "noteikumiem")}
          </Link>
          {", "}
          <Link href="/privacy" className="underline">
            {t("auth.register.privacy", "privātuma politikai")}
          </Link>{" "}
          {t("auth.register.and", "un")}{" "}
          <Link href="/cookies" className="underline">
            {t("auth.register.cookies", "sīkdatņu politikai")}
          </Link>
          .
        </p>
        {turnstile.field}
        <button type="submit" className="btn-auth" disabled={pending}>
          {pending
            ? t("auth.register.pending", "Reģistrē...")
            : t("auth.register.submit", "Reģistrēties")}
        </button>
        <GoogleSignInButton
          from="register"
          disabled={pending}
          ensureTurnstile={turnstile.ensureVerified}
          onTurnstileError={(message) => notify(message, "error")}
        />
        <p className="text-center text-sm text-[var(--muted)]">
          {t("auth.register.has_account", "Jau ir konts?")}{" "}
          <Link href="/login" className="underline">
            {t("nav.login", "Pieslēgties")}
          </Link>
        </p>
      </form>
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <EmailSentModal
        open={confirmOpen}
        title={t("auth.register.confirm_modal.title", "Reģistrācija izdevās")}
        description={t(
          "auth.register.confirm_modal.description",
          "Konts ir izveidots. Atlicis apstiprināt e-pastu.",
        )}
        body={t(
          "auth.register.confirm_modal.body",
          "Uz {email} nosūtīts apstiprinājuma e-pasts. Atver to un apstiprini adresi, lai varētu pieslēgties.",
        )}
        email={confirmEmail}
        actionLabel={t("nav.login", "Pieslēgties")}
        onLeave={() => router.push("/login")}
      />
    </AuthShell>
  );
}
