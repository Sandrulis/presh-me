import {
  ACCOUNT_DELETION_GRACE_DAYS,
  accountDeletionPurgeAtFromNow,
  accountDeletionTokenExpiresAtFromNow,
} from "@/app/lib/account/deletion-constants";
import { createDeletionConfirmToken, hashDeletionConfirmToken } from "@/app/lib/account/deletion-token";
import { purgeUserAccount } from "@/app/lib/account/purge-user";
import {
  sendAccountDeletionCancelledEmail,
  sendAccountDeletionCompletedEmail,
  sendAccountDeletionConfirmEmail,
} from "@/app/lib/email/send-account-deletion-emails";
import { getPublicSiteUrl } from "@/app/lib/site-url";
import { createAdminClient } from "@/app/lib/supabase/admin";

export type DeletionStatus = {
  pendingEmailConfirm: boolean;
  scheduled: boolean;
  purgeAt: string | null;
  confirmedAt: string | null;
};

type UserDeletionRow = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  language_code?: string | null;
  deletion_confirm_token_hash: string | null;
  deletion_confirm_token_expires_at: string | null;
  deletion_confirmed_at: string | null;
  deletion_purge_at: string | null;
};

export function mapDeletionStatus(row: Pick<
  UserDeletionRow,
  | "deletion_confirm_token_hash"
  | "deletion_confirm_token_expires_at"
  | "deletion_confirmed_at"
  | "deletion_purge_at"
>): DeletionStatus {
  const now = Date.now();
  const tokenExpires = row.deletion_confirm_token_expires_at
    ? Date.parse(row.deletion_confirm_token_expires_at)
    : NaN;
  const pendingEmailConfirm =
    Boolean(row.deletion_confirm_token_hash) &&
    Number.isFinite(tokenExpires) &&
    tokenExpires > now &&
    !row.deletion_confirmed_at;
  const purgeAt = row.deletion_purge_at;
  const purgeMs = purgeAt ? Date.parse(purgeAt) : NaN;
  const scheduled =
    Boolean(row.deletion_confirmed_at) && Boolean(purgeAt) && Number.isFinite(purgeMs) && purgeMs > now;
  return {
    pendingEmailConfirm,
    scheduled,
    purgeAt: scheduled ? purgeAt : null,
    confirmedAt: scheduled ? row.deletion_confirmed_at : null,
  };
}

export async function loadUserDeletionRow(userId: string): Promise<UserDeletionRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select(
      "id, email, name, is_admin, language_code, deletion_confirm_token_hash, deletion_confirm_token_expires_at, deletion_confirmed_at, deletion_purge_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserDeletionRow;
}

export async function requestAccountDeletion(userId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = await loadUserDeletionRow(userId);
  if (!row) return { ok: false, message: "settings.no_session" };
  if (row.is_admin) return { ok: false, message: "settings.danger.admin_blocked" };

  const status = mapDeletionStatus(row);
  if (status.scheduled) {
    return { ok: false, message: "settings.danger.already_scheduled" };
  }

  const { raw, hash } = createDeletionConfirmToken();
  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({
      deletion_confirm_token_hash: hash,
      deletion_confirm_token_expires_at: accountDeletionTokenExpiresAtFromNow(),
      deletion_confirmed_at: null,
      deletion_purge_at: null,
    })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };

  const link = `${getPublicSiteUrl()}/auth/account-deletion?token=${encodeURIComponent(raw)}`;
  const sent = await sendAccountDeletionConfirmEmail({
    email: row.email,
    name: row.name,
    languageCode: row.language_code,
    confirmLink: link,
    graceDays: String(ACCOUNT_DELETION_GRACE_DAYS),
  });
  if (!sent.ok) return { ok: false, message: sent.error };

  return { ok: true };
}

export async function confirmAccountDeletionByToken(
  rawToken: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = rawToken.trim();
  if (!token) return { ok: false, message: "settings.danger.invalid_token" };

  const admin = createAdminClient();
  const hash = hashDeletionConfirmToken(token);
  const { data: row, error } = await admin
    .from("users")
    .select(
      "id, email, name, language_code, deletion_confirm_token_hash, deletion_confirm_token_expires_at, deletion_confirmed_at",
    )
    .eq("deletion_confirm_token_hash", hash)
    .maybeSingle();
  if (error || !row) return { ok: false, message: "settings.danger.invalid_token" };

  const expires = row.deletion_confirm_token_expires_at
    ? Date.parse(row.deletion_confirm_token_expires_at)
    : NaN;
  if (!Number.isFinite(expires) || expires <= Date.now()) {
    return { ok: false, message: "settings.danger.token_expired" };
  }
  if (row.deletion_confirmed_at) {
    return { ok: false, message: "settings.danger.already_scheduled" };
  }

  const nowIso = new Date().toISOString();
  const purgeAt = accountDeletionPurgeAtFromNow();

  const { error: updateError } = await admin
    .from("users")
    .update({
      deletion_confirmed_at: nowIso,
      deletion_purge_at: purgeAt,
      deletion_confirm_token_hash: null,
      deletion_confirm_token_expires_at: null,
    })
    .eq("id", row.id);
  if (updateError) return { ok: false, message: updateError.message };

  await admin.from("pages").update({ published: false }).eq("account_id", row.id);

  return { ok: true };
}

export async function cancelScheduledAccountDeletion(
  userId: string,
  options?: { sendEmail?: boolean },
): Promise<{ ok: true; cancelled: boolean } | { ok: false; message: string }> {
  const row = await loadUserDeletionRow(userId);
  if (!row) return { ok: false, message: "settings.no_session" };

  const status = mapDeletionStatus(row);
  if (!status.scheduled) return { ok: true, cancelled: false };

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({
      deletion_confirmed_at: null,
      deletion_purge_at: null,
      deletion_confirm_token_hash: null,
      deletion_confirm_token_expires_at: null,
    })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };

  if (options?.sendEmail !== false) {
    await sendAccountDeletionCancelledEmail({
      email: row.email,
      name: row.name,
      languageCode: row.language_code,
    });
  }

  return { ok: true, cancelled: true };
}

export async function purgeDueAccountDeletions(): Promise<{ purged: number; errors: number }> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await admin
    .from("users")
    .select("id, email, name, language_code, deletion_purge_at")
    .not("deletion_purge_at", "is", null)
    .lte("deletion_purge_at", nowIso)
    .limit(50);
  if (error || !rows?.length) return { purged: 0, errors: error ? 1 : 0 };

  let purged = 0;
  let errors = 0;
  for (const row of rows) {
    await sendAccountDeletionCompletedEmail({
      email: row.email,
      name: row.name,
      languageCode: row.language_code as string | null | undefined,
      graceDays: String(ACCOUNT_DELETION_GRACE_DAYS),
    });
    const result = await purgeUserAccount(admin, row.id);
    if (result.ok) purged += 1;
    else errors += 1;
  }
  return { purged, errors };
}
