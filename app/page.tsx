"use client";

import { useMemo, useState } from "react";
import BackgroundDecoration from "@/components/BackgroundDecoration";
import Header from "@/components/Header";
import ModelViewer from "@/components/ModelViewer";
import InfoPanel from "@/components/InfoPanel";
import MaterialPanel from "@/components/MaterialPanel";
import ColorPanel from "@/components/ColorPanel";
import InfillPanel from "@/components/InfillPanel";
import QuantityPanel from "@/components/QuantityPanel";
import CheckoutFooter from "@/components/CheckoutFooter";
import { MATERIALS, INFILL_OPTIONS } from "@/lib/constants";
import { calculateTotalPrice, estimateDeliveryDate, estimateDimensions, formatEuro } from "@/lib/pricing";
import { ConfiguratorState } from "@/lib/types";

const INITIAL_STATE: ConfiguratorState = {
  fileName: null,
  dimensions: null,
  materialId: "standard",
  colorId: "antracitova",
  infillId: "light",
  quantity: 1,
  step: 1,
};

export default function Home() {
  const [state, setState] = useState<ConfiguratorState>(INITIAL_STATE);
  const [deliveryLabel, setDeliveryLabel] = useState("—");

  const material = MATERIALS.find((m) => m.id === state.materialId)!;
  const infill = INFILL_OPTIONS.find((i) => i.id === state.infillId)!;

  const totalPrice = useMemo(
    () => calculateTotalPrice(state.dimensions, material, infill, state.quantity),
    [state.dimensions, material, infill, state.quantity]
  );

  function handleFileSelected(file: File) {
    const dimensions = estimateDimensions();
    setState((prev) => ({
      ...prev,
      fileName: file.name,
      dimensions,
      step: 2,
    }));
    setDeliveryLabel(estimateDeliveryDate());
  }

  function handleRemoveFile() {
    setState((prev) => ({ ...prev, fileName: null, dimensions: null, step: 1 }));
    setDeliveryLabel("—");
  }

  function handleCheckout() {
    if (!state.fileName) return;
    setState((prev) => ({ ...prev, step: 3 }));
  }

  return (
    <div className="min-h-screen">
      <BackgroundDecoration />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Header step={state.step} />

        <main className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-5">
          <section className="flex flex-col gap-4 lg:col-span-3">
            <ModelViewer
              fileName={state.fileName}
              onFileSelected={handleFileSelected}
              onRemove={handleRemoveFile}
            />
            <InfoPanel dimensions={state.dimensions} />
          </section>

          <section className="flex flex-col gap-4 lg:col-span-2">
            <MaterialPanel
              selectedId={state.materialId}
              onSelect={(materialId) => setState((prev) => ({ ...prev, materialId }))}
            />
            <ColorPanel
              selectedId={state.colorId}
              onSelect={(colorId) => setState((prev) => ({ ...prev, colorId }))}
            />
            <InfillPanel
              selectedId={state.infillId}
              onSelect={(infillId) => setState((prev) => ({ ...prev, infillId }))}
            />
            <QuantityPanel
              quantity={state.quantity}
              onChange={(quantity) => setState((prev) => ({ ...prev, quantity }))}
            />
          </section>
        </main>

        <CheckoutFooter
          priceLabel={formatEuro(totalPrice)}
          deliveryLabel={deliveryLabel}
          disabled={!state.fileName}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}
