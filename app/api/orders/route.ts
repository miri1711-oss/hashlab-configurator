import { NextRequest, NextResponse } from "next/server";
import { insertOrder, listOrders } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const paymentMethod = String(body.paymentMethod ?? "");
    const orderId = String(body.orderNumber ?? crypto.randomUUID());
    const materialName = String(body.materialName ?? "");
    const colorLabel = String(body.colorLabel ?? "");
    const infillLabel = String(body.infillLabel ?? "");
    const layerHeightLabel = String(body.layerHeightLabel ?? "0.2 mm");
    const quantity = Number(body.quantity ?? 1);
    const totalPrice = Number(body.totalPrice ?? 0);
    const email = String(body.email ?? "");
    const fullName = String(body.fullName ?? "");
    const shippingMethod = String(body.shippingMethod ?? "");

    await insertOrder({
      id: orderId,
      fullName,
      email,
      phone: String(body.phone ?? ""),
      street: String(body.street ?? ""),
      city: String(body.city ?? ""),
      zip: String(body.zip ?? ""),
      shippingMethod,
      packetaPointName: body.packetaPointName ? String(body.packetaPointName) : null,
      paymentMethod,
      fileName: String(body.fileName ?? ""),
      modelFileUrl: body.modelFileUrl ? String(body.modelFileUrl) : null,
      paintPreviewUrl: body.paintPreviewUrl ? String(body.paintPreviewUrl) : null,
      materialName,
      colorLabel,
      hasCustomPaint: Boolean(body.hasCustomPaint),
      infillLabel,
      layerHeightLabel,
      quantity,
      totalPrice,
      status: paymentMethod === "card" ? "pending_payment" : "cod",
    });

    // Pri dobierke je objednávka rovno potvrdená (netreba čakať na platbu
    // kartou) - potvrdenie emailom môže ísť hneď. Pri platbe kartou sa
    // pošle až po potvrdení od Stripe (viď stripe-webhook route).
    if (paymentMethod !== "card") {
      await sendOrderConfirmationEmail({
        id: orderId,
        email,
        fullName,
        materialName,
        colorLabel,
        infillLabel,
        layerHeightLabel,
        quantity,
        totalPrice,
        shippingMethod,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa uložiť objednávku:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Jednoduchý prehľad objednávok - chránený tajným kľúčom v query parametri
// (?key=...), keďže projekt zatiaľ nemá skutočné prihlasovanie pre admina.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.ORDERS_VIEW_KEY || key !== process.env.ORDERS_VIEW_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const orders = await listOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Nepodarilo sa načítať objednávky:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
