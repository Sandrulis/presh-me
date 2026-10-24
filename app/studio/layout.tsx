import type { ReactNode } from "react";
import { MfaVerifyModal } from "@/app/components/mfa-verify-modal";
import { StudioFontScope } from "@/app/components/studio-font-scope";
import { resolveLoginMfaVerify } from "@/app/lib/auth/mfa-page-gate";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const needsMfa = await resolveLoginMfaVerify();
  if (needsMfa) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <MfaVerifyModal open mode="login" nextPath="/studio" />
      </div>
    );
  }
  return <StudioFontScope>{children}</StudioFontScope>;
}
