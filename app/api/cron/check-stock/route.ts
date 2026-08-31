import { NextRequest, NextResponse } from "next/server";
import { listFilamentStock } from "@/lib/db";
import { sendLowStockAlert } from "@/lib/email";

const LOW_STOCK_THRESHOLD = 100;

/**
 * Vercel Cron Job - spusti sa automaticky raz denne, skontroluje sklad
 * a posle email, ak nieco kleslo pod limit.
 */
export async function GET(request: NextRequest) {
  // Overenie, ze volanie prichadza skutocne od Vercel Cron (nie odkialkolvek)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const stock = await listFilamentStock();
    const lowStockItems = stock
      .filter((row) => Number(row.quantity_grams) < LOW_STOCK_THRESHOLD && Number(row.quantity_grams) > 0)
      .map((row) => ({
        materialName: row.material_name as string,
        colorLabel: row.color_label as string,
        quantityGrams: Number(row.quantity_grams),
      }));

    if (lowStockItems.length > 0) {
      await sendLowStockAlert(lowStockItems);
    }

    return NextResponse.json({ ok: true, lowStockCount: lowStockItems.length });
  } catch (error) {
    console.error("Cron - nepodarilo sa skontrolovat sklad:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
