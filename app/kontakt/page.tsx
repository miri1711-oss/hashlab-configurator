"use client";

import { useState } from "react";
import BackgroundDecoration from "@/components/BackgroundDecoration";

type SubmitState = "idle" | "sending" | "success" | "error";

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setErrorMessage(data.error ?? "Nepodarilo sa odoslať správu.");
        setState("error");
        return;
      }
      setState("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMessage("Nepodarilo sa odoslať správu, skontrolujte pripojenie.");
      setState("error");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundDecoration />
      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <a
            href="/"
            className="text-sm font-semibold text-[var(--text-3)] transition-colors hover:text-[var(--text-1)]"
          >
            ← Späť na konfigurátor
          </a>
        </div>

        <div className="card rounded-2xl p-5 sm:p-7">
          <p className="display mb-1 text-lg font-bold text-[var(--text-1)]">Máte otázku?</p>
          <p className="mb-6 text-sm text-[var(--text-3)]">
            Napíšte nám a ozveme sa vám čo najskôr.
          </p>

          {state === "success" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Ďakujeme, vaša správa bola odoslaná. Ozveme sa vám čoskoro.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Meno</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field-input"
                  placeholder="Vaše meno"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                  placeholder="vas@email.sk"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Správa</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="field-input min-h-[120px] resize-y"
                  placeholder="S čím vám môžeme pomôcť?"
                />
              </div>

              {state === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "sending"}
                className="btn-gradient mt-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60"
              >
                {state === "sending" ? "Odosielam…" : "Odoslať správu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
