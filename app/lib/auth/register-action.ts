"use server";

import { registerWithResendEmail } from "@/app/lib/auth/email-password";
import { isResendEnabled } from "@/app/lib/integrations/resend/client";

export async function registerAccountAction(input: {
  name: string;
  email: string;
  password: string;
  handle: string;
}): Promise<
  | { ok: true; mode: "session" }
  | { ok: true; mode: "confirm" }
  | { ok: false; message: string }
> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, message: "Ievadi vārdu." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Ievadi derīgu e-pastu." };
  }
  if (input.password.length < 8) {
    return { ok: false, message: "Parolei jābūt vismaz 8 simboliem." };
  }

  if (await isResendEnabled()) {
    const sent = await registerWithResendEmail({
      name,
      email,
      password: input.password,
    });
    if (!sent.ok) return sent;
    return { ok: true, mode: "confirm" };
  }

  // Fallback: client-side store.registerAccount still used when Resend off.
  return { ok: false, message: "__use_client_signup__" };
}

export async function requestPasswordResetAction(
  email: string,
): Promise<{ ok: true; mode: "resend" | "supabase" } | { ok: false; message: string }> {
  if (await isResendEnabled()) {
    const { requestPasswordResetWithResend } = await import("@/app/lib/auth/email-password");
    const result = await requestPasswordResetWithResend(email);
    if (!result.ok) return result;
    return { ok: true, mode: "resend" };
  }
  return { ok: true, mode: "supabase" };
}

export async function requestEmailChangeAction(input: {
  newEmail: string;
  name?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { requestEmailChangeWithResend } = await import("@/app/lib/auth/email-password");
  return requestEmailChangeWithResend(input);
}

export async function isResendEnabledAction() {
  return isResendEnabled();
}
