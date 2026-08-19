import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { listOrdersByEmail } from "@/lib/db";
import BackgroundDecoration from "@/components/BackgroundDecoration";
import LogoutButton from "@/components/LogoutButton";

const STATUS_LABELS: Record<string, string> = {
  cod: "Čaká na spracovanie (dobierka)",
  pending_payment: "Čaká na platbu",
  paid: "Zaplatené",
};

export default async function MojeObjednavkyPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "customer" || !session.email) {
    redirect("/prihlasenie");
  }

  const orders = await listOrdersByEmail(session.email!);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundDecoration />
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <a
            href="/"
            className="text-sm font-semibold text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
          >
            ← Späť na konfigurátor
          </a>
          <LogoutButton />
        </div>

        <div className="card rounded-2xl p-5 sm:p-7">
          <p className="display mb-1 text-lg font-bold text-[var(--text-1)]">Moje objednávky</p>
          <p className="mb-6 text-sm text-[var(--text-3)]">Prihlásený ako {session.email}</p>

          {orders.length === 0 ? (
            <p className="text-sm text-[var(--text-3)]">
              Zatiaľ nemáte žiadne objednávky pod týmto emailom.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <div key={order.id as string} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="mono text-sm font-bold text-[var(--text-1)]">
                      {order.id as string}
                    </span>
                    <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--text-2)]">
                      {STATUS_LABELS[order.status as string] ?? (order.status as string)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-3)]">
                    {order.material_name as string} · {order.color_label as string} ·{" "}
                    {order.quantity as number} ks
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text-1)]">
                    {Number(order.total_price).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
