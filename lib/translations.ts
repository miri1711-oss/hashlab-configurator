export type Locale = "sk" | "en";

export interface TranslationShape {
  common: {
    loading: string;
    back: string;
    continue: string;
    cancel: string;
    save: string;
  };
  header: {
    title: string;
  };
  upload: {
    dragDrop: string;
    orSelect: string;
    button: string;
  };
  material: {
    title: string;
    subtitle: string;
  };
  color: {
    title: string;
  };
  infill: {
    title: string;
  };
  layerHeight: {
    title: string;
  };
  checkout: {
    priceLabel: string;
    deliveryLabel: string;
    addToCart: string;
    addAnotherModel: string;
    cart: string;
    orderSummary: string;
    submitOrder: string;
  };
}

export const translations: Record<Locale, TranslationShape> = {
  sk: {
    common: {
      loading: "Načítavam…",
      back: "Späť",
      continue: "Pokračovať",
      cancel: "Zrušiť",
      save: "Uložiť",
    },
    header: {
      title: "Hashlab.sk — Konfigurátor 3D tlače",
    },
    upload: {
      dragDrop: "Presuňte sem .stl, .obj alebo .step súbor",
      orSelect: "alebo vyberte súbor z počítača · max. 200 MB",
      button: "Nahrať 3D model",
    },
    material: {
      title: "Materiál",
      subtitle: "Vyberte podľa účelu použitia",
    },
    color: {
      title: "Farba",
    },
    infill: {
      title: "Výplň",
    },
    layerHeight: {
      title: "Výška vrstvy",
    },
    checkout: {
      priceLabel: "Cena s DPH",
      deliveryLabel: "Odhad. doručenie",
      addToCart: "Pridať do košíka & Pokračovať",
      addAnotherModel: "+ Pridať ďalší model do objednávky",
      cart: "Košík",
      orderSummary: "Súhrn objednávky",
      submitOrder: "Záväzne objednať",
    },
  },
  en: {
    common: {
      loading: "Loading…",
      back: "Back",
      continue: "Continue",
      cancel: "Cancel",
      save: "Save",
    },
    header: {
      title: "Hashlab.sk — 3D Print Configurator",
    },
    upload: {
      dragDrop: "Drag your .stl, .obj or .step file here",
      orSelect: "or select a file from your computer · max. 200 MB",
      button: "Upload 3D model",
    },
    material: {
      title: "Material",
      subtitle: "Choose based on intended use",
    },
    color: {
      title: "Color",
    },
    infill: {
      title: "Infill",
    },
    layerHeight: {
      title: "Layer height",
    },
    checkout: {
      priceLabel: "Price incl. VAT",
      deliveryLabel: "Est. delivery",
      addToCart: "Add to cart & Continue",
      addAnotherModel: "+ Add another model to order",
      cart: "Cart",
      orderSummary: "Order summary",
      submitOrder: "Place order",
    },
  },
} as const;

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "sk";
  const lang = navigator.language.toLowerCase();
  return lang.startsWith("sk") || lang.startsWith("cs") ? "sk" : "en";
}
