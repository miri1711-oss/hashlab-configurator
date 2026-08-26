import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { listOrders, listFilamentStock } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import FilamentStockEditor from "@/components/FilamentStockEditor";
import OrdersTable from "@/components/OrdersTable";
import ManualPrinterSwitch from "@/components/ManualPrinterSwitch";
import CapacityEstimate from "@/components/CapacityEstimate";
import { listPrinterStatuses } from "@/lib/db";

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

export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.role !== "admin") {
    redirect("/admin/prihlasenie");
  }

  const orders = await listOrders();
  const filamentStock = await listFilamentStock();
  const allPrinters = await listPrinterStatuses();
  const slaPrinters = [
    { id: "sla_creality", label: "Creality (SLA)" },
    { id: "sla_phrozen", label: "Phrozen (SLA)" },
  ].map((p) => {
    const existing = allPrinters.find((row) => row.id === p.id);
    return { ...p, is_printing: existing ? Boolean(existing.is_printing) : false };
  });

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

        <div className="mb-6">
          <CapacityEstimate />
        </div>

        <div className="mb-6">
          <ManualPrinterSwitch initialPrinters={slaPrinters} />
        </div>

        <div className="mb-6">
          <FilamentStockEditor
            initialStock={filamentStock.map((row) => ({
              material_name: row.material_name as string,
              color_label: row.color_label as string,
              quantity_grams: Number(row.quantity_grams),
            }))}
          />
        </div>

        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
