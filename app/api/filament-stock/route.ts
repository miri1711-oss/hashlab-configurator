import { NextResponse } from "next/server";
import { listFilamentStock } from "@/lib/db";

export async function GET() {
  try {
    const stock = await listFilamentStock();
    return NextResponse.json({ ok: true, stock });
  } catch (error) {
    console.error("Nepodarilo sa načítať sklad filamentov:", error);
    return NextResponse.json({ ok: false, stock: [] }, { status: 500 });
  }
}
