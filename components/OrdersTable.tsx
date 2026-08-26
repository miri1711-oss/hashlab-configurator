"use client";

import { useState } from "react";
import PrintStatusButton from "@/components/PrintStatusButton";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  cod: { label: "Dobierka", color: "bg-sky-50 text-sky-700" },
  pending_payment: { label: "Čaká na platbu", color: "bg-amber-50 text-amber-700" },
  paid: { label: "Zaplatené", color: "bg-emerald-50 text-emerald-700" },
};

const SHIPPING_LABELS: Record<string, string> = {
  courier: "Kuriér",
  packeta: "Výdajné miesto",
  packeta_domov: "Packeta domov",
  pickup: "Osobný odber",
};

interface Order {
  [key: string]: unknown;
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(order.id ?? "").toLowerCase().includes(q) ||
      String(order.full_name ?? "").toLowerCase().includes(q) ||
      String(order.email ?? "").toLowerCase().includes(q) ||
      String(order.material_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hľadať podľa čísla, mena, emailu alebo materiálu…"
          className="field-input w-full sm:max-w-sm"
        />
        {search && (
          <p className="mt-1 text-xs text-[var(--text-3)]">
            Nájdených {filteredOrders.length} z {orders.length} objednávok
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-3)]">
            <tr>
              <th className="px-4 py-3">Náhľad</th>
              <th className="px-4 py-3">Číslo</th>
              <th className="px-4 py-3">Zákazník</th>
              <th className="px-4 py-3">Materiál / farba</th>
              <th className="px-4 py-3">Cena</th>
              <th className="px-4 py-3">Platba</th>
              <th className="px-4 py-3">Doprava</th>
              <th className="px-4 py-3">Odhad tlače</th>
              <th className="px-4 py-3">Poznámka</th>
              <th className="px-4 py-3">Tlač</th>
              <th className="px-4 py-3">Dátum</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const status = STATUS_LABELS[order.status as string] ?? {
                label: order.status as string,
                color: "bg-gray-100 text-gray-700",
              };
              const previewImage = (order.paint_preview_url as string) || null;

              return (
                <tr key={order.id as string} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">
                    {previewImage ? (
                      <button onClick={() => setPreviewUrl(previewImage)} className="block">
                        <img
                          src={previewImage}
                          alt="Náhľad modelu"
                          className="h-12 w-12 rounded-lg border border-[var(--border)] object-cover"
                        />
                      </button>
                    ) : (
                      <span className="text-xs text-[var(--text-3)]">—</span>
                    )}
                  </td>
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
                  <td className="px-4 py-3 text-xs text-[var(--text-3)]">
                    <div>
                      {SHIPPING_LABELS[order.shipping_method as string] ?? (order.shipping_method as string)}
                    </div>
                    {order.packeta_barcode ? (
                      <div className="mono mt-0.5 text-[var(--text-1)]">
                        {order.packeta_barcode as string}
                      </div>
                    ) : order.shipping_method === "packeta_domov" ? (
                      <div className="mt-0.5 text-amber-600">zásielka sa nevytvorila</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-3)]">
                    {order.slice_print_time_seconds ? (
                      <div>
                        <div>{Math.round((order.slice_print_time_seconds as number) / 60)} min</div>
                        <div>{Number(order.slice_filament_grams).toFixed(1)} g</div>
                      </div>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td
                    className="max-w-[160px] truncate px-4 py-3 text-xs text-[var(--text-3)]"
                    title={(order.customer_note as string) ?? ""}
                  >
                    {(order.customer_note as string) || "—"}
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

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPreviewUrl(null)}
        >
          <img src={previewUrl} alt="Náhľad modelu" className="max-h-[85vh] max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
