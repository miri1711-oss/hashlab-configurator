"use client";

import { COLORS } from "@/lib/constants";

interface PaintPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  paintColorId: string;
  onColorSelect: (id: string) => void;
  onReset: () => void;
  hasPaintedRegions: boolean;
  disabled: boolean;
}

export default function PaintPanel({
  enabled,
  onToggle,
  paintColorId,
  onColorSelect,
  onReset,
  hasPaintedRegions,
  disabled,
}: PaintPanelProps) {
  const selectedLabel = COLORS.find((c) => c.id === paintColorId)?.label ?? "";

  return (
    <div className="card relative rounded-2xl p-4 sm:p-5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(!enabled)}
        className="flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>
          <span className="display block text-sm font-bold text-[var(--text-1)]">
            Viac farieb na modeli
          </span>
          <span className="block text-xs text-[var(--text-3)]">
            Klikaním na model vyfarbi napr. QR kód inou farbou ako stojan
          </span>
        </span>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-[var(--blue-2)]" : "bg-[var(--border)]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      {disabled && (
        <p className="mt-2 text-xs text-[var(--text-3)]">
          Dostupné až po nahratí .stl modelu.
        </p>
      )}

      {enabled && !disabled && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-soft)] pt-4">
          <p className="text-xs text-[var(--text-3)]">
            Vyber farbu štetca a klikni priamo na model - vyberie sa celá súvislá plocha
            (napr. celý QR kód), nie len jeden bod.
          </p>

          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--text-2)]">Farba štetca</p>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => onColorSelect(color.id)}
                  title={color.label}
                  className={`swatch h-7 w-7 rounded-full ${color.id === paintColorId ? "selected" : ""}`}
                  style={{ background: color.swatch }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--text-3)]">
              Aktuálna farba štetca: <span className="font-semibold text-[var(--text-1)]">{selectedLabel}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={!hasPaintedRegions}
            className="w-fit text-xs font-semibold text-[var(--text-3)] hover:text-[var(--text-1)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Vymazať maľovanie
          </button>
        </div>
      )}
    </div>
  );
}
