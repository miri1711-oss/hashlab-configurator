"use client";

import { useMemo, useRef, useState } from "react";
import BackgroundDecoration from "@/components/BackgroundDecoration";
import Header from "@/components/Header";
import ModelViewer, { ModelViewerHandle } from "@/components/ModelViewer";
import PrinterStatusBadge from "@/components/PrinterStatusBadge";
import InfoPanel from "@/components/InfoPanel";
import MaterialPanel from "@/components/MaterialPanel";
import ResinTypePanel from "@/components/ResinTypePanel";
import ColorPanel from "@/components/ColorPanel";
import InfillPanel from "@/components/InfillPanel";
import LayerHeightPanel from "@/components/LayerHeightPanel";
import QuantityPanel from "@/components/QuantityPanel";
import CheckoutFooter from "@/components/CheckoutFooter";
import CheckoutFlow from "@/components/CheckoutFlow";
import PaintPanel from "@/components/PaintPanel";
import { COLORS, COLOR_HEX, INFILL_OPTIONS, LAYER_HEIGHTS,
  LAYER_HEIGHTS_SLA, MATERIALS , RESIN_TYPES } from "@/lib/constants";
import { calculateTotalPrice, estimateDeliveryDate, estimateDimensions, formatEuro, exceedsSlaMaxSize } from "@/lib/pricing";
import { ConfiguratorState, ModelDimensions } from "@/lib/types";

const INITIAL_STATE: ConfiguratorState = {
  fileName: null,
  dimensions: null,
  materialId: "standard",
  resinTypeId: "standard",
  colorId: "antracitova",
  infillId: "light",
  layerHeightId: "standard",
  quantity: 1,
  step: 1,
};

export default function Home() {
  const [state, setState] = useState<ConfiguratorState>(INITIAL_STATE);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [deliveryLabel, setDeliveryLabel] = useState("—");

  const [cartItems, setCartItems] = useState<
    Array<{
      fileName: string;
      file: File;
      materialName: string;
      colorLabel: string;
      infillLabel: string;
      layerHeightLabel: string;
      quantity: number;
      totalPrice: number;
    }>
  >([]);
  const [paintModeEnabled, setPaintModeEnabled] = useState(false);
  const [paintColorId, setPaintColorId] = useState("antracitova");
  const [paintResetSignal, setPaintResetSignal] = useState(0);
  const [paintUndoSignal, setPaintUndoSignal] = useState(0);
  const [hasPaintedRegions, setHasPaintedRegions] = useState(false);
  const [paintPreviewDataUrl, setPaintPreviewDataUrl] = useState<string | null>(null);
  const [coloredThreeMFBlob, setColoredThreeMFBlob] = useState<Blob | null>(null);
  const modelViewerRef = useRef<ModelViewerHandle>(null);

  const material = MATERIALS.find((m) => m.id === state.materialId)!;
  const infill = INFILL_OPTIONS.find((i) => i.id === state.infillId)!;
  const activeLayerHeights = state.materialId === "detail" ? LAYER_HEIGHTS_SLA : LAYER_HEIGHTS;
  const layerHeight = activeLayerHeights.find((l) => l.id === state.layerHeightId) ?? activeLayerHeights[1];

  const resinType = RESIN_TYPES.find((r) => r.id === state.resinTypeId);

  function addCurrentModelToCart() {
    if (!uploadedFile || !state.dimensions) return;
    const colorOption = COLORS.find((c) => c.id === state.colorId);
    setCartItems((prev) => [
      ...prev,
      {
        fileName: state.fileName ?? uploadedFile.name,
        file: uploadedFile,
        materialName: material.name,
        colorLabel: colorOption?.label ?? state.colorId,
        infillLabel: infill.label,
        layerHeightLabel: layerHeight.label,
        quantity: state.quantity,
        totalPrice,
      },
    ]);
    // Resetuj na novy model, ale zachovaj kosik
    setState(INITIAL_STATE);
    setUploadedFile(null);
  }
  const resinPriceMultiplier = state.materialId === "detail" ? (resinType?.priceMultiplier ?? 1) : 1;

  const totalPrice = useMemo(
    () => calculateTotalPrice(state.dimensions, material, infill, state.quantity, resinPriceMultiplier),
    [state.dimensions, material, infill, state.quantity, resinPriceMultiplier]
  );

  function handleFileSelected(file: File) {
    setUploadedFile(file);
    const isViewable = /\.(stl|obj|3mf)$/i.test(file.name);
    setState((prev) => ({
      ...prev,
      fileName: file.name,
      // Pre .stl a .obj počkáme na reálne rozmery vypočítané z geometrie
      // v STLViewer. Pre iné formáty (.step/.stp), ktoré three.js priamo
      // nevie parsovať, použijeme odhad ako predtým.
      dimensions: isViewable ? null : estimateDimensions(),
      step: 2,
    }));
    setDeliveryLabel(estimateDeliveryDate());
    setHasPaintedRegions(false);
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
    setPaintModeEnabled(false);
    setHasPaintedRegions(false);
  }

  function handleResetPaint() {
    setPaintResetSignal((prev) => prev + 1);
    setHasPaintedRegions(false);
  }

  function handleUndoPaint() {
    setPaintUndoSignal((prev) => prev + 1);
  }

  function handleCheckout() {
    if (!state.dimensions) return;
    if (hasPaintedRegions) {
      const snapshot = modelViewerRef.current?.captureSnapshot() ?? null;
      setPaintPreviewDataUrl(snapshot);
      const coloredThreeMF = modelViewerRef.current?.exportColoredThreeMF() ?? null;
      setColoredThreeMFBlob(coloredThreeMF);
    } else {
      setPaintPreviewDataUrl(null);
      setColoredThreeMFBlob(null);
    }
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

        {state.step < 3 && (
          <div className="pt-4">
            <PrinterStatusBadge />
          </div>
        )}

        {state.step < 3 ? (
          <>
            <main className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-5">
              <section className="flex flex-col gap-4 lg:col-span-3">
                <ModelViewer
                  ref={modelViewerRef}
                  file={uploadedFile}
                  colorHex={COLOR_HEX[state.colorId] ?? 0x2563eb}
                  paintMode={paintModeEnabled}
                  paintColorHex={COLOR_HEX[paintColorId] ?? 0x111527}
                  resetPaintSignal={paintResetSignal}
                  undoPaintSignal={paintUndoSignal}
                  onFileSelected={handleFileSelected}
                  onRemove={handleRemoveFile}
                  onDimensions={handleDimensionsComputed}
                  onPreviewError={handlePreviewError}
                  onPaintApplied={() => setHasPaintedRegions(true)}
                  paintColorId={paintColorId}
                  onPaintColorSelect={setPaintColorId}
                  onTogglePaintMode={setPaintModeEnabled}
                  onUndoPaint={handleUndoPaint}
                  onResetPaint={handleResetPaint}
                  hasPaintedRegions={hasPaintedRegions}
                  colorId={state.colorId}
                  onColorSelect={(colorId) => setState((prev) => ({ ...prev, colorId }))}
                />
                <InfoPanel dimensions={state.dimensions} fileName={state.fileName} />
              </section>

              <section className="flex flex-col gap-4 lg:col-span-2">
                <MaterialPanel
                  selectedId={state.materialId}
                  onSelect={(materialId) => setState((prev) => ({ ...prev, materialId }))}
                />

                {state.materialId === "detail" && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-800">
                    <p className="font-semibold">Živicová (SLA) tlač</p>
                    <p className="mt-0.5">
                      Živicové modely potrebujú po vytlačení umytie v izopropylalkohole a UV vytvrdenie -
                      počítaj s cca 1-2 dňami navyše oproti bežnej tlači.
                    </p>
                    {exceedsSlaMaxSize(state.dimensions) && (
                      <p className="mt-1.5 font-semibold text-red-700">
                        ⚠️ Tento model je pravdepodobne príliš veľký pre našu živicovú tlačiareň -
                        kontaktuj nás pred objednaním, prosím.
                      </p>
                    )}
                  </div>
                )}

                {state.materialId === "detail" && (
                  <ResinTypePanel
                    selectedId={state.resinTypeId}
                    onSelect={(resinTypeId) => setState((prev) => ({ ...prev, resinTypeId }))}
                  />
                )}
                <ColorPanel
                  selectedId={state.colorId}
                  onSelect={(colorId) => setState((prev) => ({ ...prev, colorId }))}
                />
                <PaintPanel
                  enabled={paintModeEnabled}
                  onToggle={setPaintModeEnabled}
                  paintColorId={paintColorId}
                  onColorSelect={setPaintColorId}
                  onUndo={handleUndoPaint}
                  onReset={handleResetPaint}
                  hasPaintedRegions={hasPaintedRegions}
                  disabled={!uploadedFile || !/\.(stl|obj)$/i.test(uploadedFile.name)}
                />
                <InfillPanel
                  selectedId={state.infillId}
                  onSelect={(infillId) => setState((prev) => ({ ...prev, infillId }))}
                />
                <LayerHeightPanel
                  selectedId={state.layerHeightId}
                  onSelect={(layerHeightId) => setState((prev) => ({ ...prev, layerHeightId }))}
                  options={activeLayerHeights}
                />
                <QuantityPanel
                  quantity={state.quantity}
                  onChange={(quantity) => setState((prev) => ({ ...prev, quantity }))}
                />
              </section>
            </main>

            {cartItems.length > 0 && (
              <div className="card mb-3 rounded-2xl p-4 sm:p-5">
                <p className="mb-2 text-sm font-bold text-[var(--text-1)]">
                  Košík ({cartItems.length} {cartItems.length === 1 ? "model" : "modely"})
                </p>
                <div className="flex flex-col gap-1.5">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-[var(--text-2)]">
                      <span className="truncate">
                        {item.fileName} · {item.materialName} · {item.colorLabel}
                      </span>
                      <span className="mono shrink-0 font-semibold">{item.totalPrice.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 border-t border-[var(--border)] pt-2 text-sm font-bold text-[var(--text-1)]">
                  Medzisúčet košíka: {cartItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} €
                </p>
              </div>
            )}

            {state.dimensions && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={addCurrentModelToCart}
                  className="w-full rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--text-1)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  + Pridať ďalší model do objednávky
                </button>
                <CheckoutFooter
                  priceLabel={formatEuro(
                    totalPrice + cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
                  )}
                  deliveryLabel={deliveryLabel}
                  disabled={!state.dimensions}
                  onCheckout={handleCheckout}
                />
              </div>
            )}
          </>
        ) : (
          <CheckoutFlow
            file={uploadedFile}
            paintPreviewDataUrl={paintPreviewDataUrl}
            coloredThreeMFBlob={coloredThreeMFBlob}
            summary={{
              fileName: state.fileName ?? "—",
              materialName: material.name,
              colorLabel: COLORS.find((c) => c.id === state.colorId)?.label ?? "",
              hasCustomPaint: hasPaintedRegions,
              infillLabel: infill.label,
              layerHeightLabel: layerHeight.label,
              quantity: state.quantity,
              itemsPrice: totalPrice,
              deliveryLabel,
            }}
            onBack={handleBackToConfig}
            onStartOver={handleStartOver}
            additionalCartItems={cartItems}
          />
        )}

        <footer className="mt-10 flex flex-wrap items-center justify-center gap-4 pb-6 text-xs text-[var(--text-3)]">
          <a href="/faq" className="hover:text-[var(--text-1)] hover:underline">
            Časté otázky
          </a>
          <a href="/kontakt" className="hover:text-[var(--text-1)] hover:underline">
            Kontakt
          </a>
          <a href="/obchodne-podmienky" className="hover:text-[var(--text-1)] hover:underline">
            Obchodné podmienky
          </a>
          <a href="/ochrana-udajov" className="hover:text-[var(--text-1)] hover:underline">
            Ochrana osobných údajov
          </a>
        </footer>
      </div>
    </div>
  );
}
