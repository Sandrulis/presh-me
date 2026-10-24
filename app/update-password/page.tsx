import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/app/components/update-password-form";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Jauna parole");

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
