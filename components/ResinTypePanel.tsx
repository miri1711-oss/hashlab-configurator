"use client";

import { RESIN_TYPES } from "@/lib/constants";

interface ResinTypePanelProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ResinTypePanel({ selectedId, onSelect }: ResinTypePanelProps) {
  return (
    <div className="card relative rounded-2xl p-4 sm:p-5">
      <p className="display relative mb-0.5 text-sm font-bold text-[var(--text-1)]">Typ živice</p>
      <p className="relative mb-3.5 text-xs text-[var(--text-3)]">
        Rôzne vlastnosti podľa toho, na čo model potrebuješ
      </p>
      <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RESIN_TYPES.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`option-card relative rounded-xl p-3 text-left ${
              option.id === selectedId ? "selected" : ""
            }`}
          >
            <p className="text-sm font-semibold text-[var(--text-1)]">{option.name}</p>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
