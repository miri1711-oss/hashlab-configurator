import { NextRequest, NextResponse } from "next/server";
import { adjustFilamentStock } from "@/lib/db";

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.ORDERS_VIEW_KEY || key !== process.env.ORDERS_VIEW_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const materialName = String(body.materialName ?? "");
    const colorLabel = String(body.colorLabel ?? "");
    const grams = Number(body.grams ?? 0);

    if (!materialName || !colorLabel || !grams) {
      return NextResponse.json({ ok: false, error: "Chybajuce udaje." }, { status: 400 });
    }

    // Zaporne cislo = odpocitanie zo skladu (minute pri tlaci).
    await adjustFilamentStock(materialName, colorLabel, -Math.abs(grams));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa odpocitat sklad filamentu:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
