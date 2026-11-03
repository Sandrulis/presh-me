import type { Metadata } from "next";
import { AdminSubscriptionPlansManager } from "@/app/components/admin-subscription-plans-manager";

export const metadata: Metadata = { title: "Abonementu plāni" };

export default function AdminSubscriptionPlansPage() {
  return <AdminSubscriptionPlansManager />;
}
