"use server";

import {
  authConfirmRedirectUrl,
  resolveAuthEmailLink,
} from "@/app/lib/auth/auth-confirm-link";
import {
  sendEmailChangeConfirmation,
  sendPasswordResetEmail,
  sendSignupConfirmation,
} from "@/app/lib/email/send-auth-emails";
import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { safeLogError } from "@/app/lib/security/safe-log";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";

async function findAuthUserByEmail(email: string) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    safeLogError("listUsers failed", error.message);
    return null;
  }
  const user = data.users.find((row) => row.email?.toLowerCase() === normalized) ?? null;
  if (!user) return null;
  return {
    id: user.id,
    emailConfirmed: Boolean(user.email_confirmed_at),
    name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "",
  };
}

export async function registerWithResendEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; needsConfirmation: true } | { ok: false; message: string }> {
  if (!(await getResendCredentials())) {
    return { ok: false, message: "E-pasta sūtīšana nav ieslēgta (Resend)." };
  }
  if (!isSupabaseAdminConfigured() || !isSupabaseConfigured()) {
    return { ok: false, message: "Datubāze nav konfigurēta." };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(email);
  if (existing?.emailConfirmed) {
    return { ok: false, message: "Šāds e-pasts jau ir reģistrēts." };
  }

  const admin = createAdminClient();
  const redirectTo = authConfirmRedirectUrl("/start");
  const generated = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: input.password,
    options: {
      data: { name },
      redirectTo,
    },
  });

  let confirmLink = resolveAuthEmailLink(generated.data?.properties, {
    type: "signup",
    next: "/start",
  });

  if (generated.error || !confirmLink) {
    if (existing && !existing.emailConfirmed) {
      await admin.auth.admin.updateUserById(existing.id, {
        password: input.password,
        user_metadata: { name },
      });
      const invite = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo },
      });
      confirmLink = resolveAuthEmailLink(invite.data?.properties, {
        type: "invite",
        next: "/start",
      });
      if (invite.error || !confirmLink) {
        safeLogError("generateLink invite failed", invite.error?.message);
        return { ok: false, message: "Neizdevās nosūtīt apstiprinājuma e-pastu." };
      }
    } else {
      safeLogError("generateLink signup failed", generated.error?.message);
      return { ok: false, message: "Neizdevās nosūtīt apstiprinājuma e-pastu." };
    }
  }

  const sent = await sendSignupConfirmation({
    email,
    confirmLink,
    name,
  });
  if (!sent.ok) {
    return { ok: false, message: "Neizdevās nosūtīt apstiprinājuma e-pastu." };
  }
  return { ok: true, needsConfirmation: true };
}

export async function requestPasswordResetWithResend(
  emailRaw: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(await getResendCredentials())) {
    return { ok: false, message: "E-pasta sūtīšana nav ieslēgta (Resend)." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, message: "Datubāze nav konfigurēta." };
  }

  const email = emailRaw.trim().toLowerCase();
  const existing = await findAuthUserByEmail(email);
  if (!existing?.emailConfirmed) {
    return { ok: true };
  }

  const admin = createAdminClient();
  const redirectTo = authConfirmRedirectUrl("/update-password");
  const generated = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  const resetLink = resolveAuthEmailLink(generated.data?.properties, {
    type: "recovery",
    next: "/update-password",
  });
  if (generated.error || !resetLink) {
    safeLogError("generateLink recovery failed", generated.error?.message);
    return { ok: false, message: "Neizdevās nosūtīt paroles atjaunošanas e-pastu." };
  }

  const sent = await sendPasswordResetEmail({
    email,
    resetLink,
    name: existing.name,
  });
  if (!sent.ok) {
    return { ok: false, message: "Neizdevās nosūtīt paroles atjaunošanas e-pastu." };
  }
  return { ok: true };
}

export async function requestEmailChangeWithResend(input: {
  newEmail: string;
  name?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(await getResendCredentials())) {
    return { ok: false, message: "E-pasta sūtīšana nav ieslēgta (Resend)." };
  }
  if (!isSupabaseAdminConfigured() || !isSupabaseConfigured()) {
    return { ok: false, message: "Datubāze nav konfigurēta." };
  }

  const newEmail = input.newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { ok: false, message: "Ievadi derīgu e-pastu." };
  }

  const { createClient } = await import("@/app/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Nav sesijas." };

  const taken = await findAuthUserByEmail(newEmail);
  if (taken && taken.id !== user.id) {
    return { ok: false, message: "Šāds e-pasts jau ir aizņemts." };
  }

  const currentEmail = user.email?.trim().toLowerCase() ?? "";
  if (!currentEmail) return { ok: false, message: "Kontam nav e-pasta." };
  if (currentEmail === newEmail) {
    return { ok: false, message: "Jaunais e-pasts sakrīt ar pašreizējo." };
  }

  const admin = createAdminClient();
  const redirectTo = authConfirmRedirectUrl("/settings");
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "email_change_new",
    email: currentEmail,
    newEmail,
    options: { redirectTo },
  });

  const confirmLink = resolveAuthEmailLink(linkData?.properties, {
    type: "email_change",
    next: "/settings",
  });

  if (linkError || !confirmLink) {
    safeLogError("generateLink email_change_new failed", linkError?.message);
    return { ok: false, message: "Neizdevās uzsākt e-pasta maiņu." };
  }

  const sent = await sendEmailChangeConfirmation({
    email: newEmail,
    confirmLink,
    name: input.name,
  });
  if (!sent.ok) {
    return { ok: false, message: "Neizdevās nosūtīt apstiprinājuma e-pastu." };
  }
  return { ok: true };
}
