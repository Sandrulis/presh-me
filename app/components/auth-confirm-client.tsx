"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { getSafeRedirectPath } from "@/app/lib/auth/auth-confirm-link";
import { createClient } from "@/app/lib/supabase/client";

const OTP_TYPES = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export function AuthConfirmClient({ next }: { next?: string }) {
  const router = useRouter();
  const { t } = useTranslations();
  const [status, setStatus] = useState<"pending" | "ok" | "fail">("pending");
  const redirectTo = getSafeRedirectPath(next, "/studio");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get("token_hash")?.trim() ?? "";
        const type = params.get("type")?.trim() ?? "";
        if (!tokenHash || !OTP_TYPES.has(type)) {
          if (!cancelled) setStatus("fail");
          return;
        }
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
        });
        if (error) {
          console.error("verifyOtp failed", error.message);
          if (!cancelled) setStatus("fail");
          return;
        }
        if (!cancelled) {
          setStatus("ok");
          const target = type === "recovery" ? "/update-password" : redirectTo;
          router.replace(target);
        }
      } catch {
        if (!cancelled) setStatus("fail");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [redirectTo, router]);

  if (status === "pending") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
        <p className="text-sm text-[var(--muted)]">{t("common.loading", "Ielādē...")}</p>
      </main>
    );
  }

  if (status === "ok") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
        <p className="text-sm text-[var(--muted)]">{t("common.loading", "Ielādē...")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <h1 className="font-display text-2xl font-bold tracking-[-0.03em]">
        {t("auth.confirm.failed_title", "Saite nav derīga")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {t(
          "auth.confirm.failed_body",
          "Apstiprinājuma saite ir novecojusi vai jau izmantota. Pieprasi jaunu e-pastu.",
        )}
      </p>
      <Link href="/login" className="btn-ink mt-6 inline-flex w-fit">
        {t("nav.login", "Pieslēgties")}
      </Link>
    </main>
  );
}
