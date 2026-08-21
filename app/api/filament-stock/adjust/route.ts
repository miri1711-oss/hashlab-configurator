import { NextRequest, NextResponse } from "next/server";
import { setFilamentStock } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Nie ste prihlásený ako administrátor." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const materialName = String(body.materialName ?? "");
    const colorLabel = String(body.colorLabel ?? "");
    const quantityGrams = Number(body.quantityGrams ?? 0);

    if (!materialName || !colorLabel) {
      return NextResponse.json({ ok: false, error: "Chybajuce udaje." }, { status: 400 });
    }

    await setFilamentStock(materialName, colorLabel, quantityGrams);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa nastavit sklad filamentu:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
