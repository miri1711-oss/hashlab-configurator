interface QuantityPanelProps {
  quantity: number;
  onChange: (quantity: number) => void;
}

export default function QuantityPanel({ quantity, onChange }: QuantityPanelProps) {
  return (
    <div className="card relative flex items-center justify-between rounded-2xl p-4 sm:p-5">
      <svg
        className="deco"
        style={{ left: -14, bottom: -18, width: 80, height: 80 }}
        viewBox="0 0 64 64"
        fill="none"
      >
        <rect x={10} y={10} width={20} height={20} rx={3} stroke="currentColor" strokeWidth={1.8} />
        <rect x={34} y={34} width={20} height={20} rx={3} stroke="currentColor" strokeWidth={1.8} />
        <rect x={34} y={10} width={20} height={20} rx={3} stroke="currentColor" strokeWidth={1.8} />
      </svg>

      <div className="relative">
        <p className="display text-sm font-bold text-[var(--text-1)]">Počet kusov</p>
        <p className="text-xs text-[var(--text-3)]">Zľava od 5 ks: −5 %</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, quantity - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] font-bold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)]"
        >
          −
        </button>
        <span className="mono w-6 text-center text-base font-bold text-[var(--text-1)]">{quantity}</span>
        <button
          onClick={() => onChange(Math.min(99, quantity + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] font-bold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)]"
        >
          +
        </button>
      </div>
    </div>
  );
}
