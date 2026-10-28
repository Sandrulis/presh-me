"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpCodeInput } from "@/app/components/otp-code-input";
import { useTranslations } from "@/app/components/translations-provider";
import { logoutAccount } from "@/app/lib/store";
import { createClient } from "@/app/lib/supabase/client";

function onlyDigits(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 6);
}

type VerifyStatus = "idle" | "pending" | "success" | "error";

const RESULT_HOLD_MS = 900;

export function MfaVerifyModal({
  open,
  mode = "admin",
  nextPath,
  onVerified,
}: {
  open: boolean;
  mode?: "admin" | "login";
  nextPath?: string;
  onVerified?: () => void;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const codeLabelId = useId();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [otpNonce, setOtpNonce] = useState(0);
  const factorIdRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);
  const queuedCodeRef = useRef<string | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLogin = mode === "login";
  const pending = verifyStatus !== "idle";
  factorIdRef.current = factorId;

  function clearResultTimer() {
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }

  useEffect(() => () => clearResultTimer(), []);

  useEffect(() => {
    if (!open) return;
    clearResultTimer();
    setCode("");
    setVerifyStatus("idle");
    verifyingRef.current = false;
    queuedCodeRef.current = null;
    setOtpNonce((value) => value + 1);
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.mfa.listFactors();
        const verified = (data?.totp ?? []).find(
          (item: { status: string; id: string }) => item.status === "verified",
        );
        setFactorId(verified?.id ?? null);
      } catch {
        setFactorId(null);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open || !factorId || !queuedCodeRef.current) return;
    void verifyCode(queuedCodeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, factorId]);

  async function leave() {
    if (isLogin) {
      await logoutAccount();
      router.push("/login");
      router.refresh();
      return;
    }
    router.push("/studio");
  }

  async function verifyCode(raw: string) {
    const digits = onlyDigits(raw);
    if (digits.length < 6) return;
    queuedCodeRef.current = digits;
    const currentFactorId = factorIdRef.current;
    if (!currentFactorId || verifyingRef.current) return;

    verifyingRef.current = true;
    setVerifyStatus("pending");
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: currentFactorId });
    if (challenge.error || !challenge.data) {
      showVerifyError();
      return;
    }

    const verified = await supabase.auth.mfa.verify({
      factorId: currentFactorId,
      challengeId: challenge.data.id,
      code: digits,
    });
    if (verified.error) {
      showVerifyError();
      return;
    }

    setVerifyStatus("success");
    clearResultTimer();
    resultTimerRef.current = setTimeout(() => {
      if (onVerified) {
        onVerified();
        return;
      }
      if (isLogin && nextPath) {
        router.push(nextPath.startsWith("/") ? nextPath : "/studio");
      }
      router.refresh();
    }, RESULT_HOLD_MS);
  }

  function showVerifyError() {
    setVerifyStatus("error");
    clearResultTimer();
    resultTimerRef.current = setTimeout(() => {
      verifyingRef.current = false;
      queuedCodeRef.current = null;
      setVerifyStatus("idle");
      setCode("");
      setOtpNonce((value) => value + 1);
    }, RESULT_HOLD_MS);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--ink)]/40 px-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mfa-verify-title"
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(14,17,22,0.2)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="mfa-verify-title" className="font-display text-xl font-bold tracking-[-0.03em]">
              {t("auth.mfa.title", "Divfaktoru autentifikācija")}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {isLogin
                ? t("auth.mfa.verify_login", "Ievadi Authenticator kodu, lai pabeigtu ielogošanos.")
                : t(
                    "auth.mfa.subtitle_admin",
                    "Administrācijas panelim nepieciešams TOTP kods (Authenticator).",
                  )}
            </p>
          </div>
          <button
            type="button"
            className="btn-quiet shrink-0"
            disabled={pending}
            onClick={() => void leave()}
            aria-label={isLogin ? t("nav.logout", "Iziet") : t("actions.cancel", "Atcelt")}
          >
            ×
          </button>
        </div>

        <div className="mt-6" aria-busy={verifyStatus === "pending"}>
          <span
            id={codeLabelId}
            className="block text-center text-sm font-semibold text-[var(--ink)]"
          >
            {t("auth.mfa.code", "Kods")}
          </span>
          <OtpCodeInput
            key={`${open ? "open" : "closed"}-${otpNonce}`}
            id="mfa-verify-code"
            value={code}
            onChange={setCode}
            onComplete={(next) => void verifyCode(next)}
            disabled={pending}
            autoFocus
            labelledBy={codeLabelId}
          />
          {verifyStatus === "idle" ? null : (
            <p
              className={`mt-3 text-center text-sm ${
                verifyStatus === "success"
                  ? "text-emerald-700"
                  : verifyStatus === "error"
                    ? "text-red-600"
                    : "text-[var(--muted)]"
              }`}
              role="status"
              aria-live="polite"
            >
              {verifyStatus === "success"
                ? t("auth.login.success", "Veiksmīgi ienāci.")
                : verifyStatus === "error"
                  ? t("errors.mfa_code_invalid", "Nepareizs kods. Mēģini vēlreiz.")
                  : t("common.loading", "Ielādē...")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
