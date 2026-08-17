import { NextRequest, NextResponse } from "next/server";
import { insertOrder, listOrders } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const paymentMethod = String(body.paymentMethod ?? "");

    await insertOrder({
      id: String(body.orderNumber ?? crypto.randomUUID()),
      fullName: String(body.fullName ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      street: String(body.street ?? ""),
      city: String(body.city ?? ""),
      zip: String(body.zip ?? ""),
      shippingMethod: String(body.shippingMethod ?? ""),
      packetaPointName: body.packetaPointName ? String(body.packetaPointName) : null,
      paymentMethod,
      fileName: String(body.fileName ?? ""),
      modelFileUrl: body.modelFileUrl ? String(body.modelFileUrl) : null,
      materialName: String(body.materialName ?? ""),
      colorLabel: String(body.colorLabel ?? ""),
      hasCustomPaint: Boolean(body.hasCustomPaint),
      infillLabel: String(body.infillLabel ?? ""),
      layerHeightLabel: String(body.layerHeightLabel ?? "0.2 mm"),
      quantity: Number(body.quantity ?? 1),
      totalPrice: Number(body.totalPrice ?? 0),
      status: paymentMethod === "card" ? "pending_payment" : "cod",
    });

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
