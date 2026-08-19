import { NextRequest, NextResponse } from "next/server";
import { listOrders } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Nie ste prihlásený ako administrátor." }, { status: 401 });
  }

  try {
    const orders = await listOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Nepodarilo sa načítať objednávky:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
