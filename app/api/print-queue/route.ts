import { NextRequest, NextResponse } from "next/server";
import { listPrintQueue, updatePrintStatus } from "@/lib/db";

function isAuthorized(request: NextRequest): boolean {
  const key = request.nextUrl.searchParams.get("key");
  return Boolean(process.env.ORDERS_VIEW_KEY) && key === process.env.ORDERS_VIEW_KEY;
}

// Skript pri tlačiarni si sem pravidelne chodí pýtať, či nepribudla nová
// zaplatená objednávka, ktorá ešte nebola poslaná do tlačovej fronty.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const orders = await listPrintQueue();
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Nepodarilo sa načítať tlačovú frontu:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Skript zavolá toto po tom, ako súbor úspešne pošle do tlačiarne, aby sa tá
// istá objednávka neposlala do tlače druhýkrát.
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String(body.orderId ?? "");
    const printStatus = String(body.printStatus ?? "sent_to_printer");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Chýba orderId." }, { status: 400 });
    }

    await updatePrintStatus(id, printStatus);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa aktualizovať stav tlače:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
