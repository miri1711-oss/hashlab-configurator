import { NextResponse } from "next/server";
import { getPendingQueueEstimate } from "@/lib/db";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { cookies } from "next/headers";

// Koniec pracovnej doby (24-hodinovy format) - uprav podla potreby.
const WORK_END_HOUR = 16;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Nie ste prihlásený ako administrátor." }, { status: 401 });
  }

  try {
    const queue = await getPendingQueueEstimate();

    const now = new Date();
    const workEnd = new Date(now);
    workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    const remainingSeconds = Math.max(0, (workEnd.getTime() - now.getTime()) / 1000);
    const queueSeconds = queue.totalSeconds;
    const freeSecondsAfterQueue = remainingSeconds - queueSeconds;

    return NextResponse.json({
      ok: true,
      queue: {
        ordersWithEstimate: queue.withEstimate,
        ordersWithoutEstimate: queue.withoutEstimate,
        queueMinutes: Math.round(queueSeconds / 60),
        remainingMinutesToday: Math.round(remainingSeconds / 60),
        freeMinutesAfterQueue: Math.round(freeSecondsAfterQueue / 60),
        canFitMore: freeSecondsAfterQueue > 0,
      },
    });
  } catch (error) {
    console.error("Nepodarilo sa vypocitat odhad kapacity:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
