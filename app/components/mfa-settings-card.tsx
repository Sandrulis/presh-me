"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { OtpCodeInput } from "@/app/components/otp-code-input";
import { SideDrawer } from "@/app/components/side-drawer";
import { useTranslations } from "@/app/components/translations-provider";
import { createClient } from "@/app/lib/supabase/client";

function toQrDataUrl(qrCode: string): string {
  if (!qrCode) return "";
  if (qrCode.startsWith("data:")) return qrCode;
  if (qrCode.includes("<svg")) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrCode)}`;
  }
  return "";
}

export function MfaSettingsCard({
  isAdmin,
  mfaReason,
  notify,
}: {
  isAdmin: boolean;
  mfaReason?: string | null;
  notify: (message: string, variant: "ok" | "error") => void;
}) {
  const { t } = useTranslations();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [otpNonce, setOtpNonce] = useState(0);
  const factorIdRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);
  const autoOpenedRef = useRef(false);
  const codeLabelId = useId();
  factorIdRef.current = factorId;

  useEffect(() => {
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.mfa.listFactors();
        const verified = (data?.totp ?? []).find(
          (item: { status: string; id: string }) => item.status === "verified",
        );
        setEnabled(Boolean(verified));
        if (verified) setFactorId(verified.id);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const enroll = useCallback(async () => {
    setPending(true);
    try {
      const supabase = createClient();
      const listed = await supabase.auth.mfa.listFactors();
      const seen = new Set<string>();
      for (const factor of [...(listed.data?.all ?? []), ...(listed.data?.totp ?? [])]) {
        if (factor.status !== "unverified" || !factor.id || seen.has(factor.id)) continue;
        seen.add(factor.id);
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Presh.Me ${Date.now()}`,
      });
      setPending(false);
      if (error || !data || !("totp" in data) || !data.totp) {
        const detail = error?.message?.trim();
        notify(
          detail
            ? `${t("errors.mfa_invalid", "MFA iestatīšana neizdevās.")} ${detail}`
            : t("errors.mfa_invalid", "MFA iestatīšana neizdevās."),
          "error",
        );
        setDrawerOpen(false);
        return;
      }
      setFactorId(data.id);
      setSecret(data.totp.secret);
      setQr(toQrDataUrl(data.totp.qr_code));
    } catch (error) {
      setPending(false);
      const detail = error instanceof Error ? error.message : "";
      notify(
        detail
          ? `${t("errors.mfa_invalid", "MFA iestatīšana neizdevās.")} ${detail}`
          : t("errors.mfa_invalid", "MFA iestatīšana neizdevās."),
        "error",
      );
      setDrawerOpen(false);
    }
  }, [notify, t]);

  const openEnrollDrawer = useCallback(() => {
    setSecret("");
    setQr("");
    setCode("");
    setDrawerOpen(true);
    void enroll();
  }, [enroll]);

  useEffect(() => {
    if (mfaReason !== "required" || enabled || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    openEnrollDrawer();
  }, [enabled, mfaReason, openEnrollDrawer]);

  async function verify(raw?: string) {
    const digits = (raw ?? code).replace(/\D/g, "").slice(0, 6);
    const currentFactorId = factorIdRef.current;
    if (!currentFactorId || digits.length < 6 || verifyingRef.current) return;

    verifyingRef.current = true;
    setPending(true);
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: currentFactorId });
    if (challenge.error || !challenge.data) {
      verifyingRef.current = false;
      setPending(false);
      setCode("");
      setOtpNonce((value) => value + 1);
      notify(t("errors.mfa_code_invalid", "Nepareizs kods. Mēģini vēlreiz."), "error");
      return;
    }
    const verified = await supabase.auth.mfa.verify({
      factorId: currentFactorId,
      challengeId: challenge.data.id,
      code: digits,
    });
    setPending(false);
    if (verified.error) {
      verifyingRef.current = false;
      setCode("");
      setOtpNonce((value) => value + 1);
      notify(t("errors.mfa_code_invalid", "Nepareizs kods. Mēģini vēlreiz."), "error");
      return;
    }
    verifyingRef.current = false;
    setEnabled(true);
    setQr("");
    setSecret("");
    setCode("");
    setDrawerOpen(false);
    notify(t("auth.mfa.enabled", "Divfaktoru autentifikācija ir ieslēgta."), "ok");
  }

  async function unenroll() {
    if (!factorId) return;
    if (isAdmin) {
      notify(
        t("auth.mfa.admin_cannot_disable", "Administratoriem MFA ir obligāta un to nevar izslēgt."),
        "error",
      );
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setPending(false);
    if (error) {
      notify(t("errors.mfa_invalid", "MFA iestatīšana neizdevās."), "error");
      return;
    }
    setEnabled(false);
    setFactorId(null);
    notify(t("auth.mfa.disabled", "Divfaktoru autentifikācija ir izslēgta."), "ok");
  }

  function closeDrawer() {
    const pendingFactorId = factorId;
    const wasEnabled = enabled;
    setDrawerOpen(false);
    setSecret("");
    setQr("");
    setCode("");
    if (!wasEnabled && pendingFactorId) {
      setFactorId(null);
      void createClient().auth.mfa.unenroll({ factorId: pendingFactorId });
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          {t("auth.mfa.title", "Divfaktoru autentifikācija")}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {t(
            "auth.mfa.subtitle",
            "Papildu solis pie ielogošanās ar Authenticator lietotni (TOTP).",
          )}
        </p>
        {isAdmin ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("auth.mfa.admin_note", "Administrācijas panelim MFA ir obligāta.")}
          </p>
        ) : null}
        {mfaReason === "required" ? (
          <p className="mt-2 text-sm text-amber-700">
            {t("auth.mfa.required", "Lai atvērtu administrāciju, vispirms ieslēdz MFA.")}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {enabled ? (
            <>
              <p className="text-sm text-[var(--muted)]">
                {t("auth.mfa.enabled", "Divfaktoru autentifikācija ir ieslēgta.")}
              </p>
              <button
                type="button"
                disabled={pending || isAdmin}
                title={
                  isAdmin
                    ? t(
                        "auth.mfa.admin_cannot_disable",
                        "Administratoriem MFA ir obligāta un to nevar izslēgt.",
                      )
                    : undefined
                }
                onClick={() => void unenroll()}
                className="btn-line px-3 py-2 text-sm"
              >
                {t("auth.mfa.unenroll", "Izslēgt MFA")}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={openEnrollDrawer}
              className="btn-ink px-3 py-2 text-sm"
            >
              {t("auth.mfa.enroll", "Ieslēgt MFA")}
            </button>
          )}
        </div>
      </div>

      <SideDrawer
        open={drawerOpen}
        side="right"
        title={t("auth.mfa.enroll", "Ieslēgt MFA")}
        hint={t(
          "auth.mfa.enroll_hint",
          "Noskenē QR kodu Authenticator lietotnē un ievadi 6 ciparu kodu.",
        )}
        onClose={closeDrawer}
      >
        <div className="space-y-4" aria-busy={pending}>
          {pending && !secret ? (
            <p className="text-sm text-[var(--muted)]">{t("common.loading", "Ielādē...")}</p>
          ) : null}
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={t("auth.mfa.qr_alt", "MFA QR kods")} className="mx-auto h-44 w-44" />
          ) : null}
          {secret ? (
            <p className="break-all text-sm text-[var(--muted)]">
              {t("auth.mfa.secret", "Noslēpums")}:{" "}
              <code className="text-[var(--ink)]">{secret}</code>
            </p>
          ) : null}
          {secret ? (
            <div className="block">
              <span
                id={codeLabelId}
                className="block text-center text-sm font-semibold text-[var(--ink)]"
              >
                {t("auth.mfa.code", "Kods")}
              </span>
              <OtpCodeInput
                key={otpNonce}
                id="mfa-settings-code"
                value={code}
                onChange={setCode}
                onComplete={(next) => void verify(next)}
                disabled={pending}
                autoFocus
                labelledBy={codeLabelId}
              />
              {pending ? (
                <p className="mt-3 text-center text-sm text-[var(--muted)]">
                  {t("common.loading", "Ielādē...")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </SideDrawer>
    </>
  );
}
