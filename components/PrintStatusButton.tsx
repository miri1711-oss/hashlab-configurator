"use client";

import { useState } from "react";

interface PrintStatusButtonProps {
  orderId: string;
  currentStatus: string;
}

const LABELS: Record<string, string> = {
  pending: "Čaká na tlač",
  sent_to_printer: "Poslané k tlačiarni",
};

export default function PrintStatusButton({ orderId, currentStatus }: PrintStatusButtonProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleToggle() {
    const nextStatus = status === "sent_to_printer" ? "pending" : "sent_to_printer";
    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin-orders/print-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, printStatus: nextStatus }),
      });
      if (response.ok) {
        setStatus(nextStatus);
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isUpdating}
      title="Kliknutím prepnete stav"
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 ${
        status === "sent_to_printer" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {isUpdating ? "…" : LABELS[status] ?? status}
    </button>
  );
}
