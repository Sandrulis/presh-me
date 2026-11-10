import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShowcaseProvider } from "@/app/components/auth-showcase-pages";
import { LoadingScreen } from "@/app/components/loading-screen";
import { RegisterForm } from "@/app/components/register-form";
import { loadAuthShowcasePages } from "@/app/lib/landing-showcase";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Reģistrēties");

export default async function RegisterPage() {
  const pages = await loadAuthShowcasePages();
  return (
    <AuthShowcaseProvider pages={pages}>
      <Suspense fallback={<LoadingScreen backdrop="auth" />}>
        <RegisterForm />
      </Suspense>
    </AuthShowcaseProvider>
  );
}
