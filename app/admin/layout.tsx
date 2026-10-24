import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MfaVerifyModal } from "@/app/components/mfa-verify-modal";
import { requireAdminPage } from "@/app/lib/auth/require-admin-server";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Admin");

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { mfaGate } = await requireAdminPage();

  if (mfaGate === "verify") {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <MfaVerifyModal open mode="admin" />
      </div>
    );
  }

  return children;
}
