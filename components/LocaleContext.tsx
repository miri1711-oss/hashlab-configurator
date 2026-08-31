"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Locale, TranslationShape, translations, detectBrowserLocale } from "@/lib/translations";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationShape;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const STORAGE_KEY = "hashlab_locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("sk");

  useEffect(() => {
    // Pri prvom nacitani - skus najprv ulozeny vyber, inak jazyk prehliadaca
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "sk" || saved === "en") {
      setLocaleState(saved);
    } else {
      setLocaleState(detectBrowserLocale());
    }
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale musi byt pouzity vo vnutri LocaleProvider");
  }
  return context;
}
