import { NextRequest, NextResponse } from "next/server";
import { updateSliceEstimate } from "@/lib/db";

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.ORDERS_VIEW_KEY || key !== process.env.ORDERS_VIEW_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "");
    const printTimeSeconds = Number(body.printTimeSeconds ?? 0);
    const filamentGrams = Number(body.filamentGrams ?? 0);

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Chyba orderId." }, { status: 400 });
    }

    await updateSliceEstimate(orderId, printTimeSeconds, filamentGrams);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa uložiť odhad rezania:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
