import { sendNotificationEmail } from "@/app/lib/email/send-templated";
import { sendTemplatedEmail } from "@/app/lib/email/send-templated";

export async function sendAccountDeletionConfirmEmail(options: {
  email: string;
  confirmLink: string;
  name?: string;
  languageCode?: string | null;
  graceDays: string;
}) {
  return sendTemplatedEmail({
    kind: "account_deletion_confirm",
    to: options.email,
    languageCode: options.languageCode,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      link: options.confirmLink,
      days: options.graceDays,
    },
  });
}

export async function sendAccountDeletionCompletedEmail(options: {
  email: string;
  name?: string;
  languageCode?: string | null;
  graceDays: string;
}) {
  return sendNotificationEmail({
    kind: "account_deletion_completed",
    to: options.email,
    languageCode: options.languageCode,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
      days: options.graceDays,
    },
  });
}

export async function sendAccountDeletionCancelledEmail(options: {
  email: string;
  name?: string;
  languageCode?: string | null;
}) {
  return sendNotificationEmail({
    kind: "account_deletion_cancelled",
    to: options.email,
    languageCode: options.languageCode,
    params: {
      name: options.name?.trim() || options.email.split("@")[0] || options.email,
    },
  });
}
