"use client";

import { useEffect, useState } from "react";

interface AmsSlot {
  slot: number;
  materialType: string;
  colorHex: string;
  remainingPercent: number | null;
}

interface PrinterStatus {
  id: string;
  is_printing: boolean;
  current_job_name: string | null;
  progress_percent: number | null;
  ams_slots_json: string | null;
  is_stale: boolean;
}

interface StockRow {
  material_name: string;
  color_label: string;
  quantity_grams: number;
}

export default function PrinterStatusBadge() {
  const [printers, setPrinters] = useState<PrinterStatus[] | null>(null);
  const [stock, setStock] = useState<StockRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statusResponse, stockResponse] = await Promise.all([
          fetch("/api/printer-status"),
          fetch("/api/filament-stock"),
        ]);
        const statusData = await statusResponse.json();
        const stockData = await stockResponse.json();
        if (!cancelled) {
          if (statusData.ok) setPrinters(statusData.printers);
          if (stockData.ok) setStock(stockData.stock);
        }
      } catch {
        // ticho zlyha - status je len informativny, nema blokovat objednavku
      }
    }

    load();
    const interval = setInterval(load, 30_000); // obnov kazdych 30 sekund
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const hasStock = stock && stock.filter((row) => row.quantity_grams > 0).length > 0;
  const hasPrinters = printers && printers.length > 0;

  if (!hasPrinters && !hasStock) return null;

  return (
    <div className="flex flex-col gap-2">
      {hasPrinters &&
        printers!.map((printer) => {
          const amsSlots: AmsSlot[] = printer.ams_slots_json ? JSON.parse(printer.ams_slots_json) : [];
          const isUnknown = printer.is_stale;
          const isPrinting = !isUnknown && printer.is_printing;

          return (
            <div
              key={printer.id}
              className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isUnknown ? "bg-gray-300" : isPrinting ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span className="font-semibold text-[var(--text-1)]">
                {isUnknown
                  ? "Stav tlačiarne momentálne neznámy"
                  : isPrinting
                    ? `Tlačiareň práve tlačí${printer.progress_percent != null ? ` (${printer.progress_percent} %)` : ""}`
                    : "Tlačiareň voľná, môžete objednať"}
              </span>

              {!isUnknown && amsSlots.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[var(--text-3)]">· Momentálne založené:</span>
                  {amsSlots.map((slot) => (
                    <span
                      key={slot.slot}
                      className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5"
                      title={`Slot ${slot.slot}${slot.remainingPercent != null ? ` - ${slot.remainingPercent}% zostáva` : ""}`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ background: slot.colorHex }}
                      />
                      {slot.materialType}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {hasStock && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs">
          <span className="font-semibold text-[var(--text-1)]">Skladom:</span>
          {stock!
            .filter((row) => row.quantity_grams > 0)
            .map((row) => (
              <span
                key={`${row.material_name}|${row.color_label}`}
                className="rounded-full bg-[var(--surface-2)] px-2 py-0.5"
              >
                {row.material_name} ({row.color_label}) - {Math.round(row.quantity_grams)} g
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
