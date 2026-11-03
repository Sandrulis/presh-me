import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountDeletionConfirmClient } from "@/app/components/account-deletion-confirm-client";
import { LoadingScreen } from "@/app/components/loading-screen";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Konta dzēšana");

export default function AccountDeletionConfirmPage() {
  return (
    <Suspense fallback={<LoadingScreen label="…" />}>
      <AccountDeletionConfirmClient />
    </Suspense>
  );
}
