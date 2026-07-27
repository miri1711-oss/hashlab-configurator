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
  {
    id: "detail",
    name: "Ultra Detail",
    description: "Resin · vysoká presnosť a hladkosť",
    pricePerCm3: 0.18,
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

export const INFILL_OPTIONS: InfillOption[] = [
  { id: "light", label: "Ľahká", percent: 15, multiplier: 1 },
  { id: "standard", label: "Štandardná", percent: 30, multiplier: 1.15 },
  { id: "strong", label: "Pevná", percent: 80, multiplier: 1.4 },
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
