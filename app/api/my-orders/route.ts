import { NextRequest, NextResponse } from "next/server";
import { listOrdersByEmail } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "customer" || !session.email) {
    return NextResponse.json({ ok: false, error: "Nie ste prihlásený." }, { status: 401 });
  }

  try {
    const orders = await listOrdersByEmail(session.email);
    return NextResponse.json({ ok: true, orders, email: session.email });
  } catch (error) {
    console.error("Nepodarilo sa načítať objednávky zákazníka:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
