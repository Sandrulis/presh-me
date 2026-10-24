import type { Metadata } from "next";
import { AdminFeedbackInbox } from "@/app/components/admin-feedback-inbox";
import { AdminPage } from "@/app/components/admin-page";

export const metadata: Metadata = { title: "Ziņojumi" };

export default function AdminFeedbackPage() {
  return (
    <AdminPage titleKey="admin.nav.feedback" titleFallback="Ziņojumi" wide>
      <AdminFeedbackInbox />
    </AdminPage>
  );
}
