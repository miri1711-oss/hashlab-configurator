"use client";

import { useState } from "react";
import { MATERIALS, COLORS } from "@/lib/constants";

interface StockRow {
  material_name: string;
  color_label: string;
  quantity_grams: number;
}

export default function FilamentStockEditor({ initialStock }: { initialStock: StockRow[] }) {
  const [stock, setStock] = useState(initialStock);
  const [material, setMaterial] = useState(MATERIALS[0]?.name ?? "");
  const [color, setColor] = useState(COLORS[0]?.label ?? "");
  const [grams, setGrams] = useState("");
  const [saving, setSaving] = useState(false);

  function currentQuantity(materialName: string, colorLabel: string): number {
    const row = stock.find((s) => s.material_name === materialName && s.color_label === colorLabel);
    return row ? row.quantity_grams : 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const quantityGrams = Number(grams);
    if (!material || !color || Number.isNaN(quantityGrams)) return;

    setSaving(true);
    try {
      const response = await fetch("/api/filament-stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialName: material, colorLabel: color, quantityGrams }),
      });
      if (response.ok) {
        setStock((prev) => {
          const others = prev.filter((s) => !(s.material_name === material && s.color_label === color));
          return [...others, { material_name: material, color_label: color, quantity_grams: quantityGrams }];
        });
        setGrams("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card rounded-2xl p-5 sm:p-6">
      <p className="display mb-1 text-base font-bold text-[var(--text-1)]">Sklad filamentov</p>
      <p className="mb-4 text-xs text-[var(--text-3)]">
        Množstvo sa automaticky odpočítava po každej automaticky narezanej tlači. Sem zadaj presné
        množstvo, čo aktuálne máš (napr. po dokúpení novej cievky).
      </p>

      <form onSubmit={handleSave} className="mb-5 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Materiál</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="field-input"
          >
            {MATERIALS.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Farba</label>
          <select value={color} onChange={(e) => setColor(e.target.value)} className="field-input">
            {COLORS.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Množstvo (g)</label>
          <input
            type="number"
            min={0}
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder={String(currentQuantity(material, color))}
            className="field-input w-28"
          />
        </div>
        <button
          type="submit"
          disabled={saving || grams === ""}
          className="btn-gradient rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Ukladám…" : "Uložiť"}
        </button>
      </form>

      {stock.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-3)]">
            <tr>
              <th className="py-2">Materiál</th>
              <th className="py-2">Farba</th>
              <th className="py-2">Skladom</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => (
              <tr key={`${row.material_name}|${row.color_label}`} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2">{row.material_name}</td>
                <td className="py-2">{row.color_label}</td>
                <td className={`py-2 font-semibold ${row.quantity_grams < 100 ? "text-red-600" : "text-[var(--text-1)]"}`}>
                  {row.quantity_grams.toFixed(0)} g
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
