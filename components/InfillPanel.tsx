import { INFILL_OPTIONS } from "@/lib/constants";
import { InfillId } from "@/lib/types";

interface InfillPanelProps {
  selectedId: InfillId;
  onSelect: (id: InfillId) => void;
}

export default function InfillPanel({ selectedId, onSelect }: InfillPanelProps) {
  return (
    <div className="card relative rounded-2xl p-4 sm:p-5">
      <svg
        className="deco"
        style={{ right: -12, top: -14, width: 85, height: 85 }}
        viewBox="0 0 64 64"
        fill="none"
      >
        <path d="M32 4L58 18V46L32 60L6 46V18L32 4Z" stroke="currentColor" strokeWidth={1.8} />
        <path d="M18 26h28M18 32h28M18 38h20" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      </svg>

      <p className="display relative mb-0.5 text-sm font-bold text-[var(--text-1)]">Pevnosť (výplň)</p>
      <p className="relative mb-3.5 text-xs text-[var(--text-3)]">
        Vyšší podiel výplne = vyššia pevnosť a hmotnosť
      </p>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
        {INFILL_OPTIONS.map((infill) => (
          <button
            key={infill.id}
            onClick={() => onSelect(infill.id)}
            className={`infill-seg rounded-lg py-2 text-sm font-semibold text-[var(--text-2)] ${
              infill.id === selectedId ? "selected" : ""
            }`}
          >
            {infill.label}
            <br />
            <span className="text-xs opacity-80">{infill.percent} %</span>
          </button>
        ))}
      </div>
    </div>
  );
}
