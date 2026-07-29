"use client";

import { useRef } from "react";
import { COLORS } from "@/lib/constants";

interface SecondaryPartPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  fileName: string | null;
  onFileSelected: (file: File) => void;
  onRemoveFile: () => void;
  colorId: string;
  onColorSelect: (id: string) => void;
}

export default function SecondaryPartPanel({
  enabled,
  onToggle,
  fileName,
  onFileSelected,
  onRemoveFile,
  colorId,
  onColorSelect,
}: SecondaryPartPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedLabel = COLORS.find((c) => c.id === colorId)?.label ?? "";

  return (
    <div className="card relative rounded-2xl p-4 sm:p-5">
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="display block text-sm font-bold text-[var(--text-1)]">
            Dvojfarebný model
          </span>
          <span className="block text-xs text-[var(--text-3)]">
            Napr. biely držiak + čierny QR kód ako samostatná časť
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

      {enabled && (
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-soft)] pt-4">
          <p className="text-xs text-[var(--text-3)]">
            Nahrajte samostatný .stl súbor pre akcentovú časť (napr. len QR kód, vyexportovaný
            zo slicera zvlášť od hlavného dielu, so zachovanými pôvodnými súradnicami).
          </p>

          {fileName ? (
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5">
              <span className="mono truncate text-xs text-[var(--text-2)]">{fileName}</span>
              <button
                type="button"
                onClick={onRemoveFile}
                className="ml-2 shrink-0 text-xs font-semibold text-[var(--text-3)] hover:text-[var(--text-1)]"
              >
                Odstrániť
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-dashed border-[var(--border)] px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--text-2)] hover:border-[var(--blue-2)] hover:text-[var(--blue-2)]"
            >
              Nahrať akcentovú časť (.stl)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelected(file);
            }}
          />

          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--text-2)]">Farba akcentu</p>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => onColorSelect(color.id)}
                  title={color.label}
                  className={`swatch h-7 w-7 rounded-full ${color.id === colorId ? "selected" : ""}`}
                  style={{ background: color.swatch }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--text-3)]">
              Vybraná farba: <span className="font-semibold text-[var(--text-1)]">{selectedLabel}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
