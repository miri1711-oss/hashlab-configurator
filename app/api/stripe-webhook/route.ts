import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderById, updateOrderStatus, updatePacketaBarcode } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { createPacketaHomeDeliveryShipment } from "@/lib/packeta";

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
        const order = await getOrderById(orderId);
        if (order) {
          await sendOrderConfirmationEmail({
            id: order.id,
            email: order.email,
            fullName: order.full_name,
            materialName: order.material_name,
            colorLabel: order.color_label,
            infillLabel: order.infill_label,
            layerHeightLabel: order.layer_height_label,
            quantity: order.quantity,
            totalPrice: Number(order.total_price),
            shippingMethod: order.shipping_method,
            isResin: order.material_name === "Ultra Detail",
          });

          // Platba kartou je uz potvrdena Stripe - az teraz je bezpecne
          // vytvorit skutocnu zasielku (predtym by sa mohlo stat, ze
          // objednavka je len "pending_payment" a platba nikdy neprejde).
          if (order.shipping_method === "packeta_domov") {
            const shipmentResult = await createPacketaHomeDeliveryShipment({
              orderNumber: order.id,
              fullName: order.full_name,
              email: order.email,
              phone: order.phone,
              street: order.street,
              city: order.city,
              zip: order.zip,
              totalPriceEur: Number(order.total_price),
              codAmountEur: null, // platba kartou uz prebehla, ziadna dobierka
            });
            if (shipmentResult.ok && shipmentResult.barcode) {
              await updatePacketaBarcode(order.id, shipmentResult.barcode);
            } else {
              console.error(`Packeta zasielka pre objednavku ${order.id} sa nepodarila:`, shipmentResult.error);
            }
          }
        }
      } catch (error) {
        console.error("Nepodarilo sa označiť objednávku ako zaplatenú:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
