"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/app/components/auth-shell";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { GoogleSignInButton } from "@/app/components/google-sign-in-button";
import { PasswordInput } from "@/app/components/password-input";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthTurnstile } from "@/app/lib/auth/use-auth-turnstile";
import { resolveEntryPathForPortfolio } from "@/app/lib/onboarding/primary-page";
import { loginAccount, getPageForAccount, getSessionId } from "@/app/lib/store";

/** Avoid double toast from React Strict Mode / Suspense remount with the same ?error=. */
let loginAuthErrorShown: string | null = null;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { notices, notify, dismissNotice } = useNotices();
  const [pending, setPending] = useState(false);
  const turnstile = useAuthTurnstile();

  const authError = params.get("error");
  useEffect(() => {
    if (!authError) {
      loginAuthErrorShown = null;
      return;
    }
    if (loginAuthErrorShown === authError) return;
    loginAuthErrorShown = authError;
    if (authError === "blocked") {
      notify(t("auth.blocked", "Pieeja sistēmai ar šo e-pastu ir liegta."), "error");
    } else if (authError === "google") {
      notify(t("auth.login.google_error", "Neizdevās pieslēgties ar Google. Mēģini vēlreiz."), "error");
    } else if (authError === "maintenance") {
      notify(
        t(
          "errors.maintenance_admin_only",
          "Apkopes režīmā pieslēgties var tikai sistēmas administrators.",
        ),
        "error",
      );
    }
    router.replace("/login", { scroll: false });
  }, [authError, notify, router, t]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const gate = await turnstile.ensureVerified();
    if (!gate.ok) {
      setPending(false);
      notify(gate.message, "error");
      return;
    }
    const result = await loginAccount(email, password);
    setPending(false);
    if (!result.ok) {
      notify(result.message, "error");
      return;
    }
    // Studio layout shows MFA challenge when TOTP is enrolled (AAL1 → AAL2).
    const sessionId = getSessionId();
    const page = sessionId ? getPageForAccount(sessionId) : null;
    router.push(resolveEntryPathForPortfolio(page));
  }

  return (
    <AuthShell
      kicker={t("auth.login.kicker", "Studija")}
      title={t("auth.login.title", "Turpini, kur paliki.")}
      subtitle={t("auth.login.subtitle", "E-pasts un parole. Tad atpakaļ pie lapas.")}
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
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between gap-3">
            <span className="auth-label mb-0">{t("common.password", "Parole")}</span>
            <Link href="/forgot-password" className="text-[13px] font-medium text-[var(--muted)] no-underline hover:text-[var(--ink)]">
              {t("auth.login.forgot", "Aizmirsi?")}
            </Link>
          </span>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
        </label>
        {turnstile.field}
        <button type="submit" className="btn-auth mt-1" disabled={pending}>
          {pending ? t("auth.login.pending", "Pārbauda...") : t("auth.login.submit", "Pieslēgties")}
        </button>
        <GoogleSignInButton
          from="login"
          disabled={pending}
          ensureTurnstile={turnstile.ensureVerified}
          onTurnstileError={(message) => notify(message, "error")}
        />
        <p className="border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)]">
          {t("auth.login.no_account", "Vēl nav konta?")}{" "}
          <Link href="/register" className="font-semibold text-[var(--accent)] no-underline">
            {t("auth.login.create_link", "Izveidot linku")}
          </Link>
        </p>
      </form>
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
    </AuthShell>
  );
}
