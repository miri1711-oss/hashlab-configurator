import { ModelDimensions } from "@/lib/types";

interface InfoPanelProps {
  dimensions: ModelDimensions | null;
  fileName?: string | null;
}

export default function InfoPanel({ dimensions, fileName }: InfoPanelProps) {
  const loaded = Boolean(dimensions);
  const processing = Boolean(fileName) && !dimensions;

  return (
    <div className="card relative rounded-2xl p-4 sm:p-5">
      <svg
        className="deco"
        style={{ right: -14, bottom: -14, width: 100, height: 100 }}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x={14} y={14} width={36} height={36} rx={4} stroke="currentColor" strokeWidth={2} />
        <path d="M14 24h36M24 14v36" stroke="currentColor" strokeWidth={2} />
      </svg>

      <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
            Rozmer X
          </p>
          <p className="mono text-sm font-semibold text-[var(--text-1)]">
            {dimensions ? `${dimensions.x} mm` : "—"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
            Rozmer Y
          </p>
          <p className="mono text-sm font-semibold text-[var(--text-1)]">
            {dimensions ? `${dimensions.y} mm` : "—"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
            Rozmer Z
          </p>
          <p className="mono text-sm font-semibold text-[var(--text-1)]">
            {dimensions ? `${dimensions.z} mm` : "—"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
            Objem
          </p>
          <p className="mono text-sm font-semibold text-[var(--text-1)]">
            {dimensions ? `${dimensions.volumeCm3.toFixed(1)} cm³` : "—"}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2.5 border-t border-[var(--border-soft)] pt-4">
        <span
          className={`h-2 w-2 rounded-full ${loaded ? "animate-pulse-dot" : ""}`}
          style={{ background: loaded ? "var(--emerald)" : "var(--border)" }}
        />
        <span className={`text-sm ${loaded ? "font-medium text-[var(--text-1)]" : "text-[var(--text-3)]"}`}>
          {loaded
            ? "Model je v poriadku a pripravený na tlač"
            : processing
              ? "Analyzujem rozmery modelu…"
              : "Model ešte nebol nahraný"}
        </span>
      </div>
    </div>
  );
}
