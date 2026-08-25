import { NextRequest, NextResponse } from "next/server";

// Nikdy neuklada tuto odpoved do medzipamate - vzdy nacita cerstve udaje
// z databazy (inak by appka mohla zakaznikovi ukazovat stary/zastaraly stav).
export const dynamic = "force-dynamic";
export const revalidate = 0;
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

    // Rucne nastavene tlaciarne (SLA - Creality, Phrozen) nemaju ziadny
    // automaticky "heartbeat", takze pre ne kontrolu starnutia
    // preskocime - ich stav plati, kym ho niekto rucne nezmeni.
    const MANUAL_PRINTER_IDS = ["sla_creality", "sla_phrozen"];

    const printers = statuses.map((row) => {
      if (MANUAL_PRINTER_IDS.includes(row.id as string)) {
        return { ...row, is_stale: false };
      }
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
