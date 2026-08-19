import { NextRequest, NextResponse } from "next/server";
import { updatePrintStatus } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Nie ste prihlásený ako administrátor." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "");
    const printStatus = String(body.printStatus ?? "");

    if (!orderId || !["pending", "sent_to_printer"].includes(printStatus)) {
      return NextResponse.json({ ok: false, error: "Neplatné údaje." }, { status: 400 });
    }

    await updatePrintStatus(orderId, printStatus);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa zmeniť stav tlače:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
