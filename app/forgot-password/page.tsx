import type { Metadata } from "next";
import { AuthShowcaseProvider } from "@/app/components/auth-showcase-pages";
import { ForgotPasswordForm } from "@/app/components/forgot-password-form";
import { loadAuthShowcasePages } from "@/app/lib/landing-showcase";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Aizmirsi paroli");

export default async function ForgotPasswordPage() {
  const pages = await loadAuthShowcasePages();
  return (
    <AuthShowcaseProvider pages={pages}>
      <ForgotPasswordForm />
    </AuthShowcaseProvider>
  );
}
