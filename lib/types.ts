export type MaterialId = "standard" | "durable" | "outdoor" | "flex" | "detail";

export interface MaterialOption {
  id: MaterialId;
  name: string;
  description: string;
  pricePerCm3: number;
}

export type InfillId = "light" | "standard" | "strong";

export interface InfillOption {
  id: InfillId;
  label: string;
  percent: number;
  multiplier: number;
}

export interface ColorOption {
  id: string;
  label: string;
  swatch: string; // CSS background value (hex alebo gradient)
}

export interface ModelDimensions {
  x: number;
  y: number;
  z: number;
  volumeCm3: number;
}

export type ConfiguratorStep = 1 | 2 | 3;

export interface ConfiguratorState {
  fileName: string | null;
  dimensions: ModelDimensions | null;
  materialId: MaterialId;
  colorId: string;
  infillId: InfillId;
  quantity: number;
  step: ConfiguratorStep;
}

export interface PriceBreakdown {
  totalWithVat: number;
  hasQuantityDiscount: boolean;
}
