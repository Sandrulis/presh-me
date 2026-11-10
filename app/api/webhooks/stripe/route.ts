import Stripe from "stripe";
import {
  extendSubscriptionWithTrialBonus,
  findUserIdByStripeCustomer,
  keepPlanEarlyClaim,
  releasePlanEarlyClaim,
  syncSubscriptionById,
} from "@/app/lib/billing/subscription-repository";
import { parseBillingInterval } from "@/app/lib/billing/billing-interval";
import { notifySubscriptionPurchasedEmail } from "@/app/lib/email/send-subscription-emails";
import { getStripeWebhookSecret } from "@/app/lib/billing/stripe-server";
import { createAdminClient } from "@/app/lib/supabase/admin";

export const runtime = "nodejs";

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const raw = invoice as Stripe.Invoice & {
    subscription?: string | { id?: string } | null;
    parent?: { subscription_details?: { subscription?: string | null } | null } | null;
  };
  if (typeof raw.subscription === "string") return raw.subscription;
  if (raw.subscription && typeof raw.subscription === "object") return raw.subscription.id ?? "";
  return raw.parent?.subscription_details?.subscription ?? "";
}

async function markUserSubscriptionCanceled(userId: string) {
  const admin = createAdminClient();
  await admin
    .from("user_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      stripe_subscription_id: null,
    })
    .eq("user_id", userId);
}

export async function POST(request: Request) {
  const webhookSecret = await getStripeWebhookSecret();
  if (!webhookSecret) {
    return Response.json({ ok: false }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id || "";
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (subscriptionId) {
          await syncSubscriptionById(subscriptionId, userId || undefined);
          await extendSubscriptionWithTrialBonus(subscriptionId);
          const planKey = session.metadata?.planKey?.trim().toLowerCase() ?? "";
          const billingInterval = parseBillingInterval(session.metadata?.billingInterval);
          const resolvedUserId =
            userId ||
            (typeof session.customer === "string"
              ? await findUserIdByStripeCustomer(session.customer)
              : "");
          if (resolvedUserId && planKey) {
            await keepPlanEarlyClaim(planKey, resolvedUserId);
            notifySubscriptionPurchasedEmail(resolvedUserId, planKey, billingInterval);
          }
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id || "";
        const planKey = session.metadata?.planKey?.trim().toLowerCase() ?? "";
        if (userId && planKey && session.id) {
          await releasePlanEarlyClaim(planKey, userId, session.id);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId || "";
        if (event.type === "customer.subscription.deleted") {
          const resolved =
            userId ||
            (typeof subscription.customer === "string"
              ? await findUserIdByStripeCustomer(subscription.customer)
              : subscription.customer?.id
                ? await findUserIdByStripeCustomer(subscription.customer.id)
                : "");
          if (resolved) await markUserSubscriptionCanceled(resolved);
        } else {
          await syncSubscriptionById(subscription.id, userId || undefined);
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (subscriptionId) {
          const userId = invoice.metadata?.userId || "";
          await syncSubscriptionById(subscriptionId, userId || undefined);
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
