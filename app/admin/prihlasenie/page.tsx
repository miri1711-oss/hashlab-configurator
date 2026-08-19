"use client";

import { useState } from "react";
import BackgroundDecoration from "@/components/BackgroundDecoration";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMessage("");
    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setErrorMessage(data.error ?? "Prihlásenie zlyhalo.");
        setState("error");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setErrorMessage("Skontrolujte pripojenie a skúste to znova.");
      setState("error");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundDecoration />
      <div className="relative mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10 sm:px-6">
        <div className="card rounded-2xl p-6 sm:p-7">
          <p className="display mb-1 text-lg font-bold text-[var(--text-1)]">Administrácia</p>
          <p className="mb-6 text-sm text-[var(--text-3)]">Prehľad objednávok</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              placeholder="Heslo"
              autoFocus
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
              {state === "sending" ? "Prihlasujem…" : "Prihlásiť sa"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
