"use client";

import { useEffect, useState } from "react";

interface QueueEstimate {
  ordersWithEstimate: number;
  ordersWithoutEstimate: number;
  queueMinutes: number;
  remainingMinutesToday: number;
  freeMinutesAfterQueue: number;
  canFitMore: boolean;
}

export default function CapacityEstimate() {
  const [data, setData] = useState<QueueEstimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/capacity-estimate")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.queue);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card rounded-2xl p-5 sm:p-6">
        <p className="text-sm text-[var(--text-3)]">Počítam dnešnú kapacitu…</p>
      </div>
    );
  }

  if (!data) return null;

  function formatMinutes(min: number): string {
    const hours = Math.floor(Math.abs(min) / 60);
    const mins = Math.abs(min) % 60;
    const sign = min < 0 ? "-" : "";
    return `${sign}${hours}h ${mins}min`;
  }

  return (
    <div className="card rounded-2xl p-5 sm:p-6">
      <p className="display mb-1 text-base font-bold text-[var(--text-1)]">Dnešná kapacita tlače</p>
      <p className="mb-4 text-xs text-[var(--text-3)]">
        Odhad podľa čakajúcej fronty a zvyšného času do konca zmeny (16:00)
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <span
          className={`h-2.5 w-2.5 rounded-full ${data.canFitMore ? "bg-emerald-500" : "bg-red-500"}`}
        />
        <span className="font-semibold text-[var(--text-1)]">
          {data.canFitMore
            ? `Ešte sa zmestí cca ${formatMinutes(data.freeMinutesAfterQueue)} tlače`
            : `Fronta presahuje dnešnú kapacitu o ${formatMinutes(data.freeMinutesAfterQueue)}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-3)] sm:grid-cols-4">
        <div>
          <p className="font-semibold text-[var(--text-1)]">{data.ordersWithEstimate}</p>
          <p>objednávok vo fronte</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-1)]">{formatMinutes(data.queueMinutes)}</p>
          <p>odhad fronty</p>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-1)]">{formatMinutes(data.remainingMinutesToday)}</p>
          <p>zostáva do 16:00</p>
        </div>
        {data.ordersWithoutEstimate > 0 && (
          <div>
            <p className="font-semibold text-amber-600">{data.ordersWithoutEstimate}</p>
            <p>bez odhadu (nezarátané)</p>
          </div>
        )}
      </div>
    </div>
  );
}
