import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrderStatus } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "Stripe webhook nie je nakonfigurovaný." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Neplatný podpis Stripe webhooku:", error);
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id;
    if (orderId) {
      try {
        await updateOrderStatus(orderId, "paid");
      } catch (error) {
        console.error("Nepodarilo sa označiť objednávku ako zaplatenú:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
