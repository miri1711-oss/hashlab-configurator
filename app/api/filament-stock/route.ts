import { NextResponse } from "next/server";

// Nikdy neuklada tuto odpoved do medzipamate - vzdy nacita cerstve udaje.
export const dynamic = "force-dynamic";
export const revalidate = 0;
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
