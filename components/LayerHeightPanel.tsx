import { LAYER_HEIGHTS } from "@/lib/constants";
import { LayerHeightId } from "@/lib/types";

interface LayerHeightPanelProps {
  selectedId: LayerHeightId;
  onSelect: (id: LayerHeightId) => void;
}

export default function LayerHeightPanel({ selectedId, onSelect }: LayerHeightPanelProps) {
  return (
    <div className="card relative rounded-2xl p-4 sm:p-5">
      <svg
        className="deco"
        style={{ right: -12, top: -14, width: 85, height: 85 }}
        viewBox="0 0 64 64"
        fill="none"
      >
        <path d="M8 20h48M8 32h48M8 44h48" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
      </svg>

      <p className="display relative mb-0.5 text-sm font-bold text-[var(--text-1)]">Výška vrstvy</p>
      <p className="relative mb-3.5 text-xs text-[var(--text-3)]">
        Jemnejšia vrstva = hladší povrch, ale dlhšia tlač
      </p>

      <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-3">
        {LAYER_HEIGHTS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`option-card relative rounded-xl p-3 text-left ${
              option.id === selectedId ? "selected" : ""
            }`}
          >
            {option.recommended && (
              <span className="absolute -top-2 right-2 rounded-full bg-[var(--blue-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Odporúčané
              </span>
            )}
            <p className="text-sm font-semibold text-[var(--text-1)]">
              {option.label} <span className="font-normal text-[var(--text-3)]">({option.mm} mm)</span>
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
