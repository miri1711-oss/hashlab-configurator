"use client";

import { useState } from "react";
import BackgroundDecoration from "@/components/BackgroundDecoration";

export default function PrihlasenniePage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMessage("");
    try {
      const response = await fetch("/api/auth/request-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setErrorMessage(data.error ?? "Nepodarilo sa odoslať prihlasovací email.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setErrorMessage("Skontrolujte pripojenie a skúste to znova.");
      setState("error");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundDecoration />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        <div className="card rounded-2xl p-6 sm:p-7">
          <div className="mb-4 flex h-9 w-9 items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Hashlab.sk logo" className="h-full w-full object-contain" />
          </div>
          <p className="display mb-1 text-lg font-bold text-[var(--text-1)]">Prihlásenie</p>
          <p className="mb-6 text-sm text-[var(--text-3)]">
            Zadajte email z vašich objednávok, pošleme vám prihlasovací odkaz.
          </p>

          {state === "sent" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Odkaz na prihlásenie sme poslali na {email}. Skontrolujte si schránku (platný 15 minút).
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="vas@email.sk"
              />
              {state === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
              <button
                type="submit"
                disabled={state === "sending"}
                className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {state === "sending" ? "Odosielam…" : "Poslať prihlasovací odkaz"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-[var(--text-3)]">
            <a href="/" className="hover:text-[var(--text-1)] hover:underline">
              ← Späť na konfigurátor
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
