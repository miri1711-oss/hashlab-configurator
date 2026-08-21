import { ColorOption, InfillOption, MaterialOption } from "./types";

export const MATERIALS: MaterialOption[] = [
  {
    id: "standard",
    name: "Štandardný plast",
    description: "PLA · bežné modely a prototypy",
    pricePerCm3: 0.06,
  },
  {
    id: "durable",
    name: "Odolný plast",
    description: "PETG · mechanicky namáhané diely",
    pricePerCm3: 0.09,
  },
  {
    id: "outdoor",
    name: "Exteriér & Teplo",
    description: "ASA · UV a teplotná odolnosť",
    pricePerCm3: 0.11,
  },
  {
    id: "flex",
    name: "Pružný gumený",
    description: "TPU · ohybné a nárazuvzdorné diely",
    pricePerCm3: 0.13,
  },
];

export const COLORS: ColorOption[] = [
  { id: "antracitova", label: "Antracitová", swatch: "#111527" },
  { id: "biela", label: "Biela", swatch: "#ffffff" },
  { id: "cervena", label: "Červená", swatch: "#ef4444" },
  { id: "modra", label: "Modrá", swatch: "linear-gradient(135deg,#38bdf8,#2563eb)" },
  { id: "zelena", label: "Zelená", swatch: "#10b981" },
  { id: "zlta", label: "Žltá", swatch: "#f59e0b" },
  { id: "siva", label: "Sivá", swatch: "#a3a9c2" },
];

// Pevná hex farba pre 3D náhľad modelu (swatch vyššie je len CSS pre UI
// tlačidlo a pri "modrá" je to gradient, čo three.js nevie použiť priamo).
export const COLOR_HEX: Record<string, number> = {
  antracitova: 0x1e2536,
  biela: 0xf3f5f9,
  cervena: 0xef4444,
  modra: 0x2563eb,
  zelena: 0x10b981,
  zlta: 0xf59e0b,
  siva: 0xa3a9c2,
};

export const INFILL_OPTIONS: InfillOption[] = [
  { id: "light", label: "Ľahká", percent: 15, multiplier: 1 },
  { id: "standard", label: "Štandardná", percent: 30, multiplier: 1.15 },
  { id: "strong", label: "Pevná", percent: 80, multiplier: 1.4 },
];

export const LAYER_HEIGHTS: LayerHeightOption[] = [
  { id: "draft", label: "Hrubšia", mm: 0.28, description: "Rýchlejšia tlač, viditeľnejšie vrstvy" },
  {
    id: "standard",
    label: "Štandardná",
    mm: 0.2,
    description: "Bežne používaná hodnota - dobrý pomer rýchlosti a kvality",
    recommended: true,
  },
  { id: "fine", label: "Jemnejšia", mm: 0.12, description: "Hladší povrch, dlhšia tlač" },
];

export const STEP_LABELS: Record<1 | 2 | 3, string> = {
  1: "Nahrať",
  2: "Konfigurácia",
  3: "Platba",
};

export const MIN_ORDER_PRICE = 4.9;
export const VAT_MULTIPLIER = 1.2;
export const QUANTITY_DISCOUNT_THRESHOLD = 5;
export const QUANTITY_DISCOUNT_MULTIPLIER = 0.95;
export const DELIVERY_DAYS_FROM_NOW = 4;
