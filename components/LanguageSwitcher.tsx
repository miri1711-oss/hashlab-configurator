"use client";

import { useLocale } from "@/components/LocaleContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white p-0.5 text-xs font-semibold">
      <button
        onClick={() => setLocale("sk")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "sk" ? "bg-[var(--blue-2)] text-white" : "text-[var(--text-3)] hover:text-[var(--text-1)]"
        }`}
      >
        SK
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "en" ? "bg-[var(--blue-2)] text-white" : "text-[var(--text-3)] hover:text-[var(--text-1)]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
