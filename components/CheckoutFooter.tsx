interface CheckoutFooterProps {
  priceLabel: string;
  deliveryLabel: string;
  disabled: boolean;
  onCheckout: () => void;
}

export default function CheckoutFooter({
  priceLabel,
  deliveryLabel,
  disabled,
  onCheckout,
}: CheckoutFooterProps) {
  return (
    <footer className="sticky bottom-0 mb-6 mt-2">
      <div className="card relative rounded-2xl p-4 sm:p-5" style={{ backdropFilter: "blur(10px)" }}>
        <svg
          className="deco"
          style={{ left: -16, top: -20, width: 110, height: 110 }}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M32 4L58 18V46L32 60L6 46V18L32 4Z" stroke="currentColor" strokeWidth={2} />
        </svg>

        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                Cena s DPH
              </p>
              <p className="display grad-text mono text-2xl font-bold">{priceLabel}</p>
            </div>
            <div className="hidden h-9 w-px bg-[var(--border)] sm:block" />
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                Odhad. doručenie
              </p>
              <p className="text-sm font-semibold text-[var(--text-2)]">{deliveryLabel}</p>
            </div>
          </div>

          <button
            disabled={disabled}
            onClick={onCheckout}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all sm:w-auto ${
              disabled
                ? "btn-disabled cursor-not-allowed text-[var(--text-3)]"
                : "btn-gradient cursor-pointer text-white"
            }`}
          >
            Pridať do košíka &amp; Pokračovať
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
