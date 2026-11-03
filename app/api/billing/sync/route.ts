import { NextResponse } from "next/server";
import { getStripeClient } from "@/app/lib/billing/stripe-server";
import { loadUserSubscriptionRow, syncSubscriptionById } from "@/app/lib/billing/subscription-repository";
import { createClient } from "@/app/lib/supabase/server";

/** Pēc Stripe Checkout atgriešanās — sinhronizē abonementu, ja webhook vēl nav nācis. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = await getStripeClient();
  if (!stripe) return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });

  const row = await loadUserSubscriptionRow(user.id);
  const customerId = row?.stripe_customer_id?.trim();
  if (!customerId) return NextResponse.json({ ok: true, synced: false });

  const listed = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 5,
  });

  const preferred =
    listed.data.find((item) => item.status === "active" || item.status === "trialing") ??
    listed.data[0];
  if (!preferred) return NextResponse.json({ ok: true, synced: false });

  await syncSubscriptionById(preferred.id, user.id);
  return NextResponse.json({ ok: true, synced: true });
}
