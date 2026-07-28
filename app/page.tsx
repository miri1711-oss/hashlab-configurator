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
import CheckoutFlow from "@/components/CheckoutFlow";
import { COLORS, INFILL_OPTIONS, MATERIALS } from "@/lib/constants";
import { calculateTotalPrice, estimateDeliveryDate, estimateDimensions, formatEuro } from "@/lib/pricing";
import { ConfiguratorState, ModelDimensions } from "@/lib/types";

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [deliveryLabel, setDeliveryLabel] = useState("—");

  const material = MATERIALS.find((m) => m.id === state.materialId)!;
  const infill = INFILL_OPTIONS.find((i) => i.id === state.infillId)!;

  const totalPrice = useMemo(
    () => calculateTotalPrice(state.dimensions, material, infill, state.quantity),
    [state.dimensions, material, infill, state.quantity]
  );

  function handleFileSelected(file: File) {
    setUploadedFile(file);
    const isStl = file.name.toLowerCase().endsWith(".stl");
    setState((prev) => ({
      ...prev,
      fileName: file.name,
      // Pre .stl počkáme na reálne rozmery vypočítané z geometrie v STLViewer.
      // Pre iné formáty (.step/.stp), ktoré three.js priamo nevie parsovať,
      // použijeme odhad ako predtým.
      dimensions: isStl ? null : estimateDimensions(),
      step: 2,
    }));
    setDeliveryLabel(estimateDeliveryDate());
  }

  function handleDimensionsComputed(dimensions: ModelDimensions) {
    setState((prev) => ({ ...prev, dimensions }));
  }

  function handlePreviewError() {
    // Ak sa STL súbor nepodarí spracovať (poškodený súbor a pod.), nespadneme -
    // použijeme odhad, nech používateľ môže pokračovať v konfigurácii.
    setState((prev) => ({ ...prev, dimensions: prev.dimensions ?? estimateDimensions() }));
  }

  function handleRemoveFile() {
    setUploadedFile(null);
    setState((prev) => ({ ...prev, fileName: null, dimensions: null, step: 1 }));
    setDeliveryLabel("—");
  }

  function handleCheckout() {
    if (!state.dimensions) return;
    setState((prev) => ({ ...prev, step: 3 }));
  }

  function handleBackToConfig() {
    setState((prev) => ({ ...prev, step: 2 }));
  }

  function handleStartOver() {
    setUploadedFile(null);
    setState(INITIAL_STATE);
    setDeliveryLabel("—");
  }

  return (
    <div className="min-h-screen">
      <BackgroundDecoration />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Header step={state.step} />

        {state.step < 3 ? (
          <>
            <main className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-5">
              <section className="flex flex-col gap-4 lg:col-span-3">
                <ModelViewer
                  file={uploadedFile}
                  onFileSelected={handleFileSelected}
                  onRemove={handleRemoveFile}
                  onDimensions={handleDimensionsComputed}
                  onPreviewError={handlePreviewError}
                />
                <InfoPanel dimensions={state.dimensions} fileName={state.fileName} />
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
              disabled={!state.dimensions}
              onCheckout={handleCheckout}
            />
          </>
        ) : (
          <CheckoutFlow
            summary={{
              fileName: state.fileName ?? "—",
              materialName: material.name,
              colorLabel: COLORS.find((c) => c.id === state.colorId)?.label ?? "",
              infillLabel: infill.label,
              quantity: state.quantity,
              itemsPrice: totalPrice,
              deliveryLabel,
            }}
            onBack={handleBackToConfig}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
}
