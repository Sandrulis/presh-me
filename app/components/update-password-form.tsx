"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/app/components/auth-shell";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { PasswordInput } from "@/app/components/password-input";
import { useTranslations } from "@/app/components/translations-provider";
import { createClient } from "@/app/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const { t } = useTranslations();
  const { notices, notify, dismissNotice } = useNotices();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      notify(t("auth.register.password_hint", "Vismaz 8 simboli."), "error");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify(t("auth.password.updated", "Parole atjaunota."), "ok");
    router.replace("/studio");
  }

  return (
    <AuthShell
      kicker={t("auth.forgot.kicker", "Konts")}
      title={t("auth.password.title", "Jauna parole")}
      subtitle={t("auth.password.subtitle", "Izvēlies jaunu paroli savam kontam.")}
    >
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <label className="block">
          <span className="auth-label">{t("auth.password.new", "Jaunā parole")}</span>
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <button type="submit" className="btn-auth" disabled={pending}>
          {pending ? t("common.loading", "Ielādē...") : t("actions.save", "Saglabāt")}
        </button>
        <p className="text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="underline">
            {t("nav.login", "Pieslēgties")}
          </Link>
        </p>
      </form>
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
    </AuthShell>
  );
}
