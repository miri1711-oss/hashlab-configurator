import { COLORS } from "@/lib/constants";
import { useLocale } from "@/components/LocaleContext";

interface ColorPanelProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ColorPanel({ selectedId, onSelect }: ColorPanelProps) {
  const { t } = useLocale();
  const selectedLabel = COLORS.find((c) => c.id === selectedId)?.label ?? "";

  return (
    <div className="card relative rounded-2xl p-4 sm:p-5">
      <svg
        className="deco"
        style={{ right: -16, bottom: -16, width: 90, height: 90 }}
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx={32} cy={32} r={22} stroke="currentColor" strokeWidth={1.8} />
        <circle cx={32} cy={32} r={4} fill="currentColor" />
      </svg>

      <p className="display relative mb-0.5 text-sm font-bold text-[var(--text-1)]">{t.color.title}</p>
      <p className="relative mb-3.5 text-xs text-[var(--text-3)]">
        Dostupné skladom, expedícia bez zdržania
      </p>

      <div className="flex flex-wrap gap-3">
        {COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => onSelect(color.id)}
            title={color.label}
            className={`swatch h-8 w-8 rounded-full ${color.id === selectedId ? "selected" : ""}`}
            style={{ background: color.swatch }}
          />
        ))}
      </div>

      <p className="mt-3 text-xs text-[var(--text-3)]">
        Vybraná farba: <span className="font-semibold text-[var(--text-1)]">{selectedLabel}</span>
      </p>
    </div>
  );
}
