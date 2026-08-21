import { MATERIALS } from "@/lib/constants";
import { MaterialId } from "@/lib/types";

interface MaterialPanelProps {
  selectedId: MaterialId;
  onSelect: (id: MaterialId) => void;
}

const MATERIAL_ICONS: Record<MaterialId, JSX.Element> = {
  standard: <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" stroke="#2563eb" strokeWidth={1.6} />,
  durable: (
    <path d="M12 2L4 5V11C4 16 7.5 20 12 22C16.5 20 20 16 20 11V5L12 2Z" stroke="#2563eb" strokeWidth={1.6} />
  ),
  outdoor: (
    <>
      <circle cx={12} cy={12} r={4.5} stroke="#2563eb" strokeWidth={1.6} />
      <path
        d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        stroke="#2563eb"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  flex: <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" stroke="#2563eb" strokeWidth={1.6} strokeLinecap="round" />,
};

export default function MaterialPanel({ selectedId, onSelect }: MaterialPanelProps) {
  return (
    <div className="card rounded-2xl p-4 sm:p-5">
      <p className="display mb-0.5 text-sm font-bold text-[var(--text-1)]">Materiál</p>
      <p className="mb-3.5 text-xs text-[var(--text-3)]">Vyberte podľa účelu použitia</p>

      <div className="grid grid-cols-1 gap-2">
        {MATERIALS.map((material) => {
          const isSelected = material.id === selectedId;
          return (
            <button
              key={material.id}
              onClick={() => onSelect(material.id)}
              className={`mat-card flex items-center gap-3 rounded-xl border border-[var(--border)] px-3.5 py-3 text-left ${
                isSelected ? "selected" : ""
              }`}
            >
              <svg className="mat-icon" width={46} height={46} viewBox="0 0 24 24" fill="none">
                {MATERIAL_ICONS[material.id]}
              </svg>
              <span className="accent-bar h-9 w-1 shrink-0 rounded-full" />
              <span className="relative flex flex-1 items-center justify-between">
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-1)]">{material.name}</span>
                  <span className="block text-xs text-[var(--text-3)]">{material.description}</span>
                </span>
                <span className="mono ml-2 shrink-0 text-xs text-[var(--text-2)]">
                  {material.pricePerCm3.toFixed(2).replace(".", ",")} €/cm³
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
