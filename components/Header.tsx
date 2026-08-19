import { ConfiguratorStep } from "@/lib/types";
import { STEP_LABELS } from "@/lib/constants";

interface HeaderProps {
  step: ConfiguratorStep;
}

export default function Header({ step }: HeaderProps) {
  const steps: ConfiguratorStep[] = [1, 2, 3];

  return (
    <header className="relative flex flex-col gap-4 overflow-hidden border-b border-[var(--border-soft)] pb-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <svg
        className="deco hidden md:block"
        style={{ right: -10, top: -18, width: 160, height: 160 }}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M50 8L86 28V72L50 92L14 72V28L50 8Z" stroke="currentColor" strokeWidth={2} />
        <path d="M50 8V92M14 28L50 48M86 28L50 48" stroke="currentColor" strokeWidth={2} />
      </svg>

      <div className="relative flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Hashlab.sk logo"
              className="h-full w-full object-contain"
              style={{ imageRendering: "auto" }}
            />
          </div>
          <span className="display text-[16px] font-bold tracking-tight text-[var(--text-1)]">
            Hashlab<span className="grad-text">.sk</span>
          </span>
        </div>
        <span className="hidden h-6 w-px bg-[var(--border)] sm:block" />
        <span className="hidden text-xs font-medium text-[var(--text-3)] sm:inline">
          Konfigurátor 3D tlače
        </span>
      </div>

      <div className="relative flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] font-semibold sm:gap-3 sm:text-xs">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className={`step-dot ${s <= step ? "active" : ""}`} />
              <span className={s <= step ? "text-[var(--text-1)]" : "text-[var(--text-3)]"}>
                {s}. {STEP_LABELS[s]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="step-line hidden sm:inline-block">
                <span
                  className="fill"
                  style={{ width: step >= (s + 1) ? "100%" : "0%" }}
                />
              </span>
            )}
          </div>
        ))}
        <a
          href="/moje-objednavky"
          className="btn-gradient rounded-full px-3 py-1.5 text-white"
        >
          Moje objednávky
        </a>
        <a
          href="/faq"
          className="btn-gradient rounded-full px-3 py-1.5 text-white"
        >
          FAQ
        </a>
        <a
          href="/kontakt"
          className="btn-gradient rounded-full px-3 py-1.5 text-white"
        >
          Kontakt
        </a>
      </div>
    </header>
  );
}
