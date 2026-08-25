"use client";

import { useState } from "react";

interface ManualPrinter {
  id: string;
  label: string;
  is_printing: boolean;
}

export default function ManualPrinterSwitch({ initialPrinters }: { initialPrinters: ManualPrinter[] }) {
  const [printers, setPrinters] = useState(initialPrinters);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(printerId: string, newState: boolean) {
    setSaving(printerId);
    try {
      const response = await fetch("/api/printer-status/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerId, isPrinting: newState }),
      });
      if (response.ok) {
        setPrinters((prev) => prev.map((p) => (p.id === printerId ? { ...p, is_printing: newState } : p)));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card rounded-2xl p-5 sm:p-6">
      <p className="display mb-1 text-base font-bold text-[var(--text-1)]">SLA tlačiarne (ručný stav)</p>
      <p className="mb-4 text-xs text-[var(--text-3)]">
        Tieto tlačiarne nemajú živé automatické sledovanie - prepni stav ručne, keď začneš/skončíš tlač.
      </p>

      <div className="flex flex-col gap-2">
        {printers.map((printer) => (
          <div
            key={printer.id}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${printer.is_printing ? "bg-amber-500" : "bg-emerald-500"}`}
              />
              <span className="font-semibold text-[var(--text-1)]">{printer.label}</span>
              <span className="text-xs text-[var(--text-3)]">
                {printer.is_printing ? "Práve tlačí" : "Voľná"}
              </span>
            </div>
            <button
              onClick={() => toggle(printer.id, !printer.is_printing)}
              disabled={saving === printer.id}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              {saving === printer.id
                ? "Ukladám…"
                : printer.is_printing
                  ? "Označiť ako voľná"
                  : "Označiť ako tlačí"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
