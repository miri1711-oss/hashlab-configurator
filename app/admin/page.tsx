import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { listOrders } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import PrintStatusButton from "@/components/PrintStatusButton";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  cod: { label: "Dobierka", color: "bg-sky-50 text-sky-700" },
  pending_payment: { label: "Čaká na platbu", color: "bg-amber-50 text-amber-700" },
  paid: { label: "Zaplatené", color: "bg-emerald-50 text-emerald-700" },
};

export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "admin") {
    redirect("/admin/prihlasenie");
  }

  const orders = await listOrders();

  return (
    <div className="min-h-screen bg-[var(--surface-2)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="display text-lg font-bold text-[var(--text-1)]">Objednávky</p>
            <p className="text-sm text-[var(--text-3)]">Spolu {orders.length} (posledných 200)</p>
          </div>
          <LogoutButton />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-3)]">
              <tr>
                <th className="px-4 py-3">Číslo</th>
                <th className="px-4 py-3">Zákazník</th>
                <th className="px-4 py-3">Materiál / farba</th>
                <th className="px-4 py-3">Cena</th>
                <th className="px-4 py-3">Platba</th>
                <th className="px-4 py-3">Tlač</th>
                <th className="px-4 py-3">Dátum</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status as string] ?? {
                  label: order.status as string,
                  color: "bg-gray-100 text-gray-700",
                };
                return (
                  <tr key={order.id as string} className="border-b border-[var(--border)] last:border-0">
                    <td className="mono px-4 py-3 font-semibold text-[var(--text-1)]">
                      {order.id as string}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]">
                      <div>{order.full_name as string}</div>
                      <div className="text-xs text-[var(--text-3)]">{order.email as string}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]">
                      {order.material_name as string} · {order.color_label as string}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-1)]">
                      {Number(order.total_price).toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PrintStatusButton
                        orderId={order.id as string}
                        currentStatus={order.print_status as string}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-3)]">
                      {new Date(order.created_at as string).toLocaleDateString("sk-SK")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
