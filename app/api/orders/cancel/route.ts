import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { getOrderByIdForCustomer, cancelOrder } from "@/lib/db";

/**
 * Umozni prihlasenemu zakaznikovi zrusit VLASTNU objednavku, len ak este
 * nezacala tlac (print_status !== 'sent_to_printer' a in.). Ak bola
 * zaplatena kartou, automaticky sa vrati platba cez Stripe.
 */
export async function POST(request: NextRequest) {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "customer" || !session.email) {
    return NextResponse.json({ ok: false, error: "Musíte byť prihlásený/á." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "");
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Chýba orderId." }, { status: 400 });
    }

    const order = await getOrderByIdForCustomer(orderId, session.email);
    if (!order) {
      return NextResponse.json({ ok: false, error: "Objednávka sa nenašla." }, { status: 404 });
    }

    // Nedovol zrusit, ak uz ide do tlace, alebo uz je zrusena/hotova.
    const blockedStatuses = ["sent_to_printer", "cancelled"];
    if (blockedStatuses.includes(order.print_status as string) || order.status === "cancelled") {
      return NextResponse.json(
        { ok: false, error: "Túto objednávku už nie je možné zrušiť (je v procese tlače alebo už bola zrušená)." },
        { status: 400 }
      );
    }

    // Ak bola zaplatena kartou a mame ulozeny payment intent, vrat platbu.
    if (order.status === "paid" && order.stripe_payment_intent) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ ok: false, error: "Stripe nie je nakonfigurovaný." }, { status: 500 });
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent as string,
        });
      } catch (stripeError) {
        console.error("Nepodarilo sa vrátiť platbu cez Stripe:", stripeError);
        return NextResponse.json(
          { ok: false, error: "Nepodarilo sa automaticky vrátiť platbu. Kontaktujte nás prosím priamo." },
          { status: 500 }
        );
      }
    }

    await cancelOrder(orderId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa zrušiť objednávku:", error);
    return NextResponse.json({ ok: false, error: "Nastala chyba, skúste to prosím znova." }, { status: 500 });
  }
}
