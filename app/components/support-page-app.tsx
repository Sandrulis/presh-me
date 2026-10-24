"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { AppShell } from "@/app/components/app-shell";
import { LoadingScreen } from "@/app/components/loading-screen";
import { ContactForm } from "@/app/components/site-contact-dialog";
import { FeedbackForm } from "@/app/components/site-feedback-dialog";
import type { FeedbackKind } from "@/app/lib/feedback/types";
import { getSessionId, isStoreReady, readSessionAccount, subscribeStore } from "@/app/lib/store";

export function SupportPageApp({ kind }: { kind: FeedbackKind | "contact" }) {
  const router = useRouter();
  const ready = useSyncExternalStore(subscribeStore, isStoreReady, () => false);
  const sessionId = useSyncExternalStore(subscribeStore, getSessionId, () => null);
  const account = useSyncExternalStore(subscribeStore, readSessionAccount, () => null);

  useEffect(() => {
    if (ready && !sessionId) router.replace("/login");
  }, [ready, sessionId, router]);

  if (!ready || !sessionId || !account) {
    return <LoadingScreen />;
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-lg px-5 py-10">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
          {kind === "contact" ? (
            <ContactForm account={account} embedded />
          ) : (
            <FeedbackForm kind={kind} account={account} embedded />
          )}
        </div>
      </main>
    </AppShell>
  );
}
