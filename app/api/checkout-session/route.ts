import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, error: "Stripe zatiaľ nie je nastavený (chýba STRIPE_SECRET_KEY)." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const body = await request.json();
    const orderId = String(body.orderId);
    const totalPrice = Number(body.totalPrice);
    const origin = request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Objednávka ${orderId} - hashlab.sk` },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      client_reference_id: orderId,
      customer_email: body.email ? String(body.email) : undefined,
      success_url: `${origin}/objednavka-uspech?order=${encodeURIComponent(orderId)}`,
      cancel_url: `${origin}/`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("Nepodarilo sa vytvoriť Stripe platbu:", error);
    return NextResponse.json({ ok: false, error: "Nepodarilo sa vytvoriť platbu." }, { status: 500 });
  }
}
