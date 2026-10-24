"use client";

import { useState, type FormEvent } from "react";
import { AdminModal } from "@/app/components/admin-ui";
import { FeedbackToasts, useNotices, type NoticeTone } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { submitContactMessage } from "@/app/lib/feedback/store";
import type { Account } from "@/app/lib/types";

type NotifyFn = (text: string, tone?: NoticeTone) => void;

export function SiteContactDialog({
  account,
  onClose,
  notify,
}: {
  account: Account | null;
  onClose: () => void;
  notify: NotifyFn;
}) {
  if (!account) return null;
  return <ContactForm account={account} onClose={onClose} notify={notify} />;
}

export function ContactForm({
  account,
  onClose,
  embedded,
  notify: notifyProp,
}: {
  account: Account;
  onClose?: () => void;
  embedded?: boolean;
  notify?: NotifyFn;
}) {
  const { t } = useTranslations();
  const local = useNotices();
  const notify = notifyProp ?? local.notify;
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const title = t("contact.title", "Kontakti");
  const lead = t("contact.lead", "Uzraksti, un mēs atbildēsim uz norādīto e-pastu.");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    void submitContactMessage({
      accountId: account.id,
      name,
      email,
      subject,
      message,
    }).then((result) => {
      setPending(false);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      notify(t("contact.sent", "Ziņa ir nosūtīta."), "ok");
      setSubject("");
      setMessage("");
      onClose?.();
    });
  }

  const form = (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          {t("common.name", "Vārds")}
          <input
            required
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          {t("common.email", "E-pasts")}
          <input
            required
            type="email"
            maxLength={200}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        {t("contact.subject", "Temats")}
        <input
          required
          maxLength={120}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        {t("contact.message", "Ziņa")}
        <textarea
          required
          rows={5}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-normal"
        />
      </label>
      <div className="flex justify-end gap-2">
        {onClose ? (
          <button type="button" onClick={onClose} disabled={pending} className="btn-line">
            {t("actions.cancel", "Atcelt")}
          </button>
        ) : null}
        <button type="submit" disabled={pending} className="btn-ink">
          {t("actions.send", "Nosūtīt")}
        </button>
      </div>
    </form>
  );

  if (embedded) {
    return (
      <>
        {notifyProp ? null : <FeedbackToasts notices={local.notices} onDismiss={local.dismissNotice} />}
        <div className="mb-5">
          <h1 className="font-display text-3xl font-bold tracking-[-0.04em]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{lead}</p>
        </div>
        {form}
      </>
    );
  }

  return (
    <AdminModal
      open
      title={title}
      description={lead}
      onClose={pending ? () => undefined : () => onClose?.()}
    >
      {form}
    </AdminModal>
  );
}
