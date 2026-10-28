import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingScreen } from "@/app/components/loading-screen";
import { LoginForm } from "@/app/components/login-form";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Pieslēgties");

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen backdrop="auth" />}>
      <LoginForm />
    </Suspense>
  );
}
