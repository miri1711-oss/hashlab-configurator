import { NextRequest, NextResponse } from "next/server";
import { upsertPrinterStatus } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Rucne prepnutie stavu tlaciarne z admin panelu - pouziva sa pre
 * tlaciarne bez zivej (automatickej) integracie, napr. SLA tlaciarne.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Nie ste prihlásený ako administrátor." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const printerId = String(body.printerId ?? "");
    const isPrinting = Boolean(body.isPrinting);
    const currentJobName = body.currentJobName ? String(body.currentJobName) : null;

    if (!printerId) {
      return NextResponse.json({ ok: false, error: "Chýba printerId." }, { status: 400 });
    }

    await upsertPrinterStatus({
      printerId,
      isPrinting,
      currentJobName,
      progressPercent: null,
      amsSlots: [],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa rucne nastavit stav tlaciarne:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
