export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
          <img src="/logo.png" alt="Hashlab.sk" className="h-full w-full object-contain" />
        </div>

        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))" }}
        >
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="var(--emerald)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="display text-xl font-bold text-[var(--text-1)]">Platba prebehla úspešne</h1>
        <p className="text-sm text-[var(--text-3)]">
          Ďakujeme za objednávku, jej súhrn sme poslali na váš email.
        </p>
        {searchParams.order && (
          <p className="mono rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text-2)]">
            Číslo objednávky: {searchParams.order}
          </p>
        )}

        <div className="mt-2 w-full rounded-xl border border-[var(--border)] p-4 text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
            Čo bude nasledovať
          </p>
          <ol className="flex flex-col gap-2.5 text-sm text-[var(--text-2)]">
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-bold text-[var(--text-1)]">
                1
              </span>
              Objednávku spracujeme a pripravíme na tlač.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-bold text-[var(--text-1)]">
                2
              </span>
              Ozveme sa vám, keď bude vytlačená a pripravená na odoslanie/vyzdvihnutie.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[11px] font-bold text-[var(--text-1)]">
                3
              </span>
              Doručíme ju zvoleným spôsobom dopravy.
            </li>
          </ol>
        </div>

        <a href="/" className="btn-gradient mt-1 w-full rounded-xl px-6 py-3 text-sm font-bold text-white">
          Späť na hlavnú stránku
        </a>

        <div className="flex gap-4 text-xs text-[var(--text-3)]">
          <a href="/faq" className="hover:text-[var(--text-1)] hover:underline">
            Časté otázky
          </a>
          <a href="/kontakt" className="hover:text-[var(--text-1)] hover:underline">
            Mám otázku k objednávke
          </a>
        </div>
      </div>
    </div>
  );
}
