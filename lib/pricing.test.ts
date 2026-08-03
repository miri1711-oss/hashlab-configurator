import { describe, expect, it } from "vitest";
import { calculateTotalPrice, formatEuro } from "./pricing";
import {
  MIN_ORDER_PRICE,
  QUANTITY_DISCOUNT_MULTIPLIER,
  QUANTITY_DISCOUNT_THRESHOLD,
  VAT_MULTIPLIER,
} from "./constants";
import { InfillOption, MaterialOption, ModelDimensions } from "./types";

// Testovacie "fixtures" - nezávislé od skutočného zoznamu materiálov/výplní
// v constants.ts, aby zmena cenníka v budúcnosti nezlomila tieto testy.
const STANDARD_MATERIAL: MaterialOption = {
  id: "standard",
  name: "Testovací plast",
  description: "test",
  pricePerCm3: 0.1,
};

const NO_MULTIPLIER_INFILL: InfillOption = {
  id: "light",
  label: "Ľahká",
  percent: 15,
  multiplier: 1,
};

const DOUBLE_INFILL: InfillOption = {
  id: "strong",
  label: "Pevná",
  percent: 80,
  multiplier: 2,
};

const DIMENSIONS_100CM3: ModelDimensions = { x: 10, y: 10, z: 10, volumeCm3: 100 };

describe("calculateTotalPrice", () => {
  it("vráti 0, keď model ešte nie je nahraný (dimensions = null)", () => {
    expect(calculateTotalPrice(null, STANDARD_MATERIAL, NO_MULTIPLIER_INFILL, 1)).toBe(0);
  });

  it("vypočíta cenu = objem × cena_za_cm3 × DPH pre bežný prípad nad minimálnou cenou", () => {
    // 100 cm3 * 0.10 €/cm3 = 10 € pred DPH, po DPH * 1.2 = 12 €
    const price = calculateTotalPrice(DIMENSIONS_100CM3, STANDARD_MATERIAL, NO_MULTIPLIER_INFILL, 1);
    expect(price).toBeCloseTo(10 * VAT_MULTIPLIER, 5);
  });

  it("aplikuje multiplikátor výplne na jednotkovú cenu", () => {
    const price = calculateTotalPrice(DIMENSIONS_100CM3, STANDARD_MATERIAL, DOUBLE_INFILL, 1);
    // 100 * 0.10 * 2 = 20 € pred DPH
    expect(price).toBeCloseTo(20 * VAT_MULTIPLIER, 5);
  });

  it("nikdy nepustí cenu jedného kusu pod MIN_ORDER_PRICE, aj pri veľmi malom modeli", () => {
    const tinyModel: ModelDimensions = { x: 1, y: 1, z: 1, volumeCm3: 0.01 };
    const price = calculateTotalPrice(tinyModel, STANDARD_MATERIAL, NO_MULTIPLIER_INFILL, 1);
    expect(price).toBeCloseTo(MIN_ORDER_PRICE * VAT_MULTIPLIER, 5);
  });

  it("násobí cenu počtom kusov, keď je pod prahom pre množstevnú zľavu", () => {
    const quantity = QUANTITY_DISCOUNT_THRESHOLD - 1;
    const price = calculateTotalPrice(DIMENSIONS_100CM3, STANDARD_MATERIAL, NO_MULTIPLIER_INFILL, quantity);
    expect(price).toBeCloseTo(10 * quantity * VAT_MULTIPLIER, 5);
  });

  it("aplikuje množstevnú zľavu, keď počet kusov dosiahne prah", () => {
    const quantity = QUANTITY_DISCOUNT_THRESHOLD;
    const price = calculateTotalPrice(DIMENSIONS_100CM3, STANDARD_MATERIAL, NO_MULTIPLIER_INFILL, quantity);
    const expected = 10 * quantity * QUANTITY_DISCOUNT_MULTIPLIER * VAT_MULTIPLIER;
    expect(price).toBeCloseTo(expected, 5);
  });

  it("neaplikuje zľavu tesne pod prahom (hraničný prípad, off-by-one)", () => {
    const quantity = QUANTITY_DISCOUNT_THRESHOLD - 1;
    const withoutDiscount = calculateTotalPrice(
      DIMENSIONS_100CM3,
      STANDARD_MATERIAL,
      NO_MULTIPLIER_INFILL,
      quantity
    );
    const perUnit = withoutDiscount / quantity;
    // Ak by sa zľava omylom aplikovala aj tu, cena za kus by bola nižšia.
    expect(perUnit).toBeCloseTo(10 * VAT_MULTIPLIER, 5);
  });
});

describe("formatEuro", () => {
  it("formátuje celé číslo s dvoma desatinnými miestami a symbolom €", () => {
    expect(formatEuro(10)).toBe("10,00 €");
  });

  it("zaokrúhli na dve desatinné miesta", () => {
    expect(formatEuro(10.786)).toBe("10,79 €");
  });

  it("použije čiarku ako desatinný oddeľovač (slovenský formát)", () => {
    expect(formatEuro(4.9)).toBe("4,90 €");
  });

  it("zvládne nulu", () => {
    expect(formatEuro(0)).toBe("0,00 €");
  });
});
