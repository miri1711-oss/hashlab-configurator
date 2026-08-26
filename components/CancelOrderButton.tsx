"use client";

import { useState } from "react";

export default function CancelOrderButton({
  orderId,
  canCancel,
}: {
  orderId: string;
  canCancel: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "confirming" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!canCancel || status === "done") return null;

  async function handleCancel() {
    setStatus("loading");
    try {
      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (data.ok) {
        setStatus("done");
        // Obnov stranku, nech sa zmena prejavi v zozname objednavok
        window.location.reload();
      } else {
        setErrorMessage(data.error || "Nepodarilo sa zrušiť objednávku.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Nastala chyba, skúste to prosím znova.");
      setStatus("error");
    }
  }

  if (status === "confirming") {
    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-[var(--text-3)]">Naozaj zrušiť?</span>
        <button
          onClick={handleCancel}
          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
        >
          Áno, zrušiť
        </button>
        <button
          onClick={() => setStatus("idle")}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--surface-2)]"
        >
          Ponechať
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setStatus("confirming")}
        disabled={status === "loading"}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
      >
        {status === "loading" ? "Ruším…" : "Zrušiť objednávku"}
      </button>
      {status === "error" && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
    </div>
  );
}
