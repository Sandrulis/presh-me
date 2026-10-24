import { sendTemplatedEmail } from "@/app/lib/email/send-templated";

export async function sendSignupConfirmation(options: {
  email: string;
  confirmLink: string;
  name?: string;
  languageCode?: string | null;
}) {
  return sendTemplatedEmail({
    kind: "signup",
    to: options.email,
    languageCode: options.languageCode,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      link: options.confirmLink,
    },
  });
}

export async function sendPasswordResetEmail(options: {
  email: string;
  resetLink: string;
  name?: string;
  languageCode?: string | null;
}) {
  return sendTemplatedEmail({
    kind: "password_reset",
    to: options.email,
    languageCode: options.languageCode,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      link: options.resetLink,
    },
  });
}

export async function sendEmailChangeConfirmation(options: {
  email: string;
  confirmLink: string;
  name?: string;
  languageCode?: string | null;
}) {
  return sendTemplatedEmail({
    kind: "email_change",
    to: options.email,
    languageCode: options.languageCode,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      link: options.confirmLink,
    },
  });
}
