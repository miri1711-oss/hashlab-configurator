import { NextRequest, NextResponse } from "next/server";
import { upsertPrinterStatus, listPrinterStatuses, AmsSlot } from "@/lib/db";

/**
 * POST - volá lokálny skript pri tlačiarni, pravidelne, so skutočným
 * stavom (chránené rovnakým kľúčom ako tlačová fronta).
 */
export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.ORDERS_VIEW_KEY || key !== process.env.ORDERS_VIEW_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const amsSlots: AmsSlot[] = Array.isArray(body.amsSlots) ? body.amsSlots : [];

    await upsertPrinterStatus({
      printerId: String(body.printerId ?? "hlavna"),
      isPrinting: Boolean(body.isPrinting),
      currentJobName: body.currentJobName ? String(body.currentJobName) : null,
      progressPercent: body.progressPercent != null ? Number(body.progressPercent) : null,
      amsSlots,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa uložiť stav tlačiarne:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/**
 * GET - verejné, cita to appka pre zakaznikov (bez potreby kluca).
 * Zamerne nevraciame nic citlive (len stav tlace a zoznam materialov).
 */
export async function GET() {
  try {
    const statuses = await listPrinterStatuses();
    const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minut

    const printers = statuses.map((row) => {
      const updatedAt = new Date(row.updated_at as string);
      const isStale = Date.now() - updatedAt.getTime() > STALE_AFTER_MS;
      return { ...row, is_stale: isStale };
    });

    return NextResponse.json({ ok: true, printers });
  } catch (error) {
    console.error("Nepodarilo sa načítať stav tlačiarne:", error);
    return NextResponse.json({ ok: false, printers: [] }, { status: 500 });
  }
}
