import {
  MIN_ORDER_PRICE,
  QUANTITY_DISCOUNT_MULTIPLIER,
  QUANTITY_DISCOUNT_THRESHOLD,
  VAT_MULTIPLIER,
  DELIVERY_DAYS_FROM_NOW,
  RESIN_SUPPORT_SURCHARGE_MULTIPLIER,
  SLA_MAX_DIMENSIONS_MM,
} from "./constants";
import { InfillOption, MaterialOption, ModelDimensions } from "./types";

/**
 * Vygeneruje "namerané" rozmery modelu. V originálnom prototype šlo o náhodné
 * čísla simulujúce analýzu nahraného STL/STEP súboru - tu zachovávame rovnaké
 * správanie, aby demo fungovalo bez reálneho 3D parseru.
 */
export function estimateDimensions(): ModelDimensions {
  const x = Number((Math.random() * 120 + 30).toFixed(1));
  const y = Number((Math.random() * 120 + 30).toFixed(1));
  const z = Number((Math.random() * 120 + 30).toFixed(1));
  const volumeCm3 = (x * y * z * 0.28) / 1000;
  return { x, y, z, volumeCm3 };
}

export function calculateTotalPrice(
  dimensions: ModelDimensions | null,
  material: MaterialOption,
  infill: InfillOption,
  quantity: number
): number {
  if (!dimensions) return 0;

  let unitPrice = dimensions.volumeCm3 * material.pricePerCm3 * infill.multiplier;
  if (material.id === "detail") {
    // Zivica (SLA) - prirazka za podpery a extra spracovanie po tlaci.
    unitPrice *= RESIN_SUPPORT_SURCHARGE_MULTIPLIER;
  }
  unitPrice = Math.max(unitPrice, MIN_ORDER_PRICE);

  let subtotal = unitPrice * quantity;
  if (quantity >= QUANTITY_DISCOUNT_THRESHOLD) {
    subtotal *= QUANTITY_DISCOUNT_MULTIPLIER;
  }

  return subtotal * VAT_MULTIPLIER;
}

export function formatEuro(value: number): string {
  return (
    value.toLocaleString("sk-SK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

export function estimateDeliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + DELIVERY_DAYS_FROM_NOW);
  return d.toLocaleDateString("sk-SK", { day: "numeric", month: "long" });
}

/**
 * Overi, ci model presahuje maximalnu tlacovu plochu SLA/zivicovej
 * tlaciarne. Vracia true, ak je model prilis velky.
 */
export function exceedsSlaMaxSize(dimensions: ModelDimensions | null): boolean {
  if (!dimensions) return false;
  return (
    dimensions.x > SLA_MAX_DIMENSIONS_MM.x ||
    dimensions.y > SLA_MAX_DIMENSIONS_MM.y ||
    dimensions.z > SLA_MAX_DIMENSIONS_MM.z
  );
}
