import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  syncInvoiceFromStripe,
  syncSubscriptionFromStripe,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${(err as Error).message}`,
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "invoice.finalized":
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.voided":
      case "invoice.updated":
        await syncInvoiceFromStripe(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscriptionFromStripe(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        // Ignore other event types.
        break;
    }
  } catch (err) {
    // Log but don't fail the webhook; Stripe will retry.
    console.error("[stripe webhook] handler error", event.type, err);
  }

  return NextResponse.json({ received: true });
}
