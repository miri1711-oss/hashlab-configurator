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

export default function PrinterStatusBadge() {
  const [printers, setPrinters] = useState<PrinterStatus[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/printer-status");
        const data = await response.json();
        if (!cancelled && data.ok) {
          setPrinters(data.printers);
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

  if (!printers || printers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {printers.map((printer) => {
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
    </div>
  );
}
