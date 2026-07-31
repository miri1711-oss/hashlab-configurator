export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center">
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
        <p className="text-sm text-[var(--text-3)]">Ďakujeme za objednávku, potvrdenie sme poslali emailom.</p>
        {searchParams.order && (
          <p className="mono text-sm text-[var(--text-2)]">Číslo objednávky: {searchParams.order}</p>
        )}
        <a
          href="/"
          className="btn-gradient mt-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
        >
          Späť na hlavnú stránku
        </a>
      </div>
    </div>
  );
}
