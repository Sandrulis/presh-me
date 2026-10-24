"use client";

import { useState, type FormEvent } from "react";
import { AdminModal } from "@/app/components/admin-ui";
import { FeedbackImagesField } from "@/app/components/feedback-images-field";
import { FeedbackToasts, useNotices, type NoticeTone } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { submitUserFeedback } from "@/app/lib/feedback/store";
import type { FeedbackKind } from "@/app/lib/feedback/types";
import type { Account } from "@/app/lib/types";

type NotifyFn = (text: string, tone?: NoticeTone) => void;

export function SiteFeedbackDialog({
  kind,
  account,
  onClose,
  notify,
}: {
  kind: FeedbackKind | null;
  account: Account | null;
  onClose: () => void;
  notify: NotifyFn;
}) {
  if (!kind || !account) return null;
  return <FeedbackForm key={kind} kind={kind} account={account} onClose={onClose} notify={notify} />;
}

export function FeedbackForm({
  kind,
  account,
  onClose,
  embedded,
  notify: notifyProp,
}: {
  kind: FeedbackKind;
  account: Account;
  onClose?: () => void;
  embedded?: boolean;
  notify?: NotifyFn;
}) {
  const { t } = useTranslations();
  const local = useNotices();
  const notify = notifyProp ?? local.notify;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const allowImages = kind === "bug" || kind === "suggestion";

  const copy = {
    bug: {
      title: t("feedback.bug.title", "Atrast kļūdu?"),
      lead: t(
        "feedback.bug.lead",
        "Apraksti kļūdu. Ziņojums tiks saglabāts un vēlāk nosūtīts uz kontaktu e-pastu.",
      ),
      sent: t("feedback.bug.sent", "Paldies, kļūdas ziņojums nosūtīts."),
      titlePlaceholder: t("feedback.bug.title_ph", "Īss kļūdas kopsavilkums"),
      bodyPlaceholder: t("feedback.bug.body_ph", "Kas notika, ko gaidīji un kā to atkārtot"),
    },
    suggestion: {
      title: t("feedback.suggestion.title", "Ieteikumi"),
      lead: t(
        "feedback.suggestion.lead",
        "Iesaki, ko uzlabot. Ziņojums tiks saglabāts un vēlāk nosūtīts uz kontaktu e-pastu.",
      ),
      sent: t("feedback.suggestion.sent", "Paldies, ieteikums nosūtīts."),
      titlePlaceholder: t("feedback.suggestion.title_ph", "Ko vēlies pievienot vai mainīt?"),
      bodyPlaceholder: t(
        "feedback.suggestion.body_ph",
        "Kāpēc tas palīdzētu un kā to izmantotu",
      ),
    },
    feedback: {
      title: t("feedback.feedback.title", "Atsauksmes"),
      lead: t(
        "feedback.feedback.lead",
        "Padalies ar savu viedokli. Ziņojums tiks saglabāts un vēlāk nosūtīts uz kontaktu e-pastu.",
      ),
      sent: t("feedback.feedback.sent", "Paldies, atsauksme nosūtīta."),
      titlePlaceholder: undefined as string | undefined,
      bodyPlaceholder: t("feedback.feedback.body_ph", "Kas tev patīk vai ko varētu uzlabot"),
    },
  }[kind];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    void submitUserFeedback({
      kind,
      accountId: account.id,
      email: account.email,
      name: account.name,
      title,
      body,
      rating: kind === "feedback" ? rating : undefined,
      images: allowImages ? images : undefined,
    }).then((result) => {
      setPending(false);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      notify(copy.sent, "ok");
      setTitle("");
      setBody("");
      setRating(0);
      setImages([]);
      onClose?.();
    });
  }

  const form = (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {kind === "feedback" ? <StarRating value={rating} onChange={setRating} /> : null}
      {copy.titlePlaceholder ? (
        <label className="grid gap-1.5 text-sm font-medium">
          {t("feedback.field.title", "Virsraksts")}
          <input
            required
            value={title}
            maxLength={200}
            placeholder={copy.titlePlaceholder}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-normal"
          />
        </label>
      ) : null}
      <label className="grid gap-1.5 text-sm font-medium">
        {t("feedback.field.body", "Apraksts")}
        <textarea
          required
          value={body}
          rows={5}
          maxLength={4000}
          placeholder={copy.bodyPlaceholder}
          onChange={(event) => setBody(event.target.value)}
          className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-normal"
        />
      </label>
      {allowImages ? (
        <FeedbackImagesField
          images={images}
          onChange={setImages}
          onError={(message) => notify(message, "error")}
          disabled={pending}
        />
      ) : null}
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
          <h1 className="font-display text-3xl font-bold tracking-[-0.04em]">{copy.title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{copy.lead}</p>
        </div>
        {form}
      </>
    );
  }

  return (
    <AdminModal
      open
      wide={allowImages}
      title={copy.title}
      description={copy.lead}
      onClose={pending ? () => undefined : () => onClose?.()}
    >
      {form}
    </AdminModal>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const { t } = useTranslations();
  return (
    <div>
      <p id="feedback-rating" className="text-sm font-medium">
        {t("feedback.rating", "Vērtējums")}
      </p>
      <div role="radiogroup" aria-labelledby="feedback-rating" className="mt-1.5 flex gap-1">
        {([1, 2, 3, 4, 5] as const).map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={t("feedback.rating.star", "{count} no 5", { count: star })}
            onClick={() => onChange(star)}
            className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--paper)] ${
              value >= star ? "text-amber-500" : "text-[var(--muted)]"
            }`}
          >
            <Star filled={value >= star} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.2l2.4 5.6 6.1.6-4.6 4 1.4 6-5.3-3.2L6.7 19.4l1.4-6-4.6-4 6.1-.6L12 3.2z" />
    </svg>
  );
}
