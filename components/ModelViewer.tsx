"use client";

import { DragEvent, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import STLViewer, { STLViewerHandle } from "./STLViewer";
import { ModelDimensions } from "@/lib/types";
import { COLORS } from "@/lib/constants";

export interface ModelViewerHandle {
  scaleModel: (factor: number) => void;
  rotateModel: (axis: "x" | "y" | "z", degrees: number) => void;
  captureSnapshot: () => string | null;
  exportColoredThreeMF: () => Blob | null;
}

interface ModelViewerProps {
  file: File | null;
  colorHex: number;
  paintMode: boolean;
  paintColorHex: number;
  resetPaintSignal: number;
  undoPaintSignal: number;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  onDimensions: (dimensions: ModelDimensions) => void;
  onPreviewError: () => void;
  onPaintApplied?: () => void;
  // Nastroje na malovanie - zdielane s PaintPanel v bocnom paneli, aby sa
  // dali pouzit aj v celoobrazovkovom nahlade bez opustenia rezimu.
  paintColorId?: string;
  onPaintColorSelect?: (colorId: string) => void;
  onTogglePaintMode?: (enabled: boolean) => void;
  onUndoPaint?: () => void;
  onResetPaint?: () => void;
  hasPaintedRegions?: boolean;
  // Zakladna farba celeho modelu (nie stetec) - aby sa dala menit aj z
  // celoobrazovkoveho nahladu, nielen z bocneho panelu.
  colorId?: string;
  onColorSelect?: (colorId: string) => void;
}

type ViewerTheme = "dark" | "light";

const FLOATING_ICONS: { style: React.CSSProperties; d?: string; extra?: JSX.Element }[] = [
  {
    style: { left: "6%", bottom: "8%", width: 90, height: 90 },
    extra: (
      <>
        <circle cx={32} cy={32} r={22} strokeWidth={2} />
        <path d="M32 10v8M32 46v8M10 32h8M46 32h8" strokeWidth={2} />
      </>
    ),
  },
  { style: { right: "8%", top: "12%", width: 70, height: 70 }, d: "M32 6L56 20V44L32 58L8 44V20L32 6Z" },
  {
    style: { right: "20%", bottom: "14%", width: 56, height: 56 },
    extra: (
      <>
        <rect x={10} y={10} width={44} height={44} rx={6} strokeWidth={2} />
        <path d="M10 24h44M24 10v44" strokeWidth={2} />
      </>
    ),
  },
  { style: { left: "22%", top: "20%", width: 44, height: 44 }, d: "M8 32c6-12 12-12 18 0s12 12 18 0 12-12 18 0" },
  {
    style: { left: "6%", top: "22%", width: 34, height: 34 },
    extra: (
      <>
        <circle cx={32} cy={32} r={22} strokeWidth={2} />
        <circle cx={32} cy={32} r={6} />
      </>
    ),
  },
  { style: { right: "32%", bottom: "20%", width: 40, height: 40 }, d: "M6 3h12l3 6-9 12L3 9l3-6Z" },
  {
    style: { left: "40%", bottom: "8%", width: 48, height: 48 },
    extra: (
      <>
        <rect x={14} y={6} width={20} height={32} rx={5} strokeWidth={2} />
        <path d="M20 32h8" strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  { style: { right: "44%", top: "8%", width: 30, height: 30 }, d: "M12 32l20-20 20 20-20 20-20-20Z" },
];

const ModelViewer = forwardRef<ModelViewerHandle, ModelViewerProps>(function ModelViewer(
  {
    file,
    colorHex,
    paintMode,
    paintColorHex,
    resetPaintSignal,
    undoPaintSignal,
    onFileSelected,
    onRemove,
    onDimensions,
    onPreviewError,
    onPaintApplied,
    paintColorId,
    onPaintColorSelect,
    onTogglePaintMode,
    onUndoPaint,
    onResetPaint,
    hasPaintedRegions,
    colorId,
    onColorSelect,
  },
  forwardedRef
) {
  const stlViewerRef = useRef<STLViewerHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [theme, setTheme] = useState<ViewerTheme>("dark");

  useImperativeHandle(forwardedRef, () => ({
    scaleModel: (factor: number) => stlViewerRef.current?.scaleModel(factor),
    rotateModel: (axis: "x" | "y" | "z", degrees: number) => stlViewerRef.current?.rotateModel(axis, degrees),
    captureSnapshot: () => stlViewerRef.current?.captureSnapshot() ?? null,
    exportColoredThreeMF: () => stlViewerRef.current?.exportColoredThreeMF() ?? null,
  }));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const loaded = Boolean(file);

  useEffect(() => {
    if (!isFullscreen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);
  const isViewable = useMemo(
    () => /\.(stl|obj|3mf)$/i.test(file?.name ?? ""),
    [file]
  );
  const isDark = theme === "dark";

  function handleDrag(e: DragEvent<HTMLDivElement>, active: boolean) {
    e.preventDefault();
    setDragActive(active);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) onFileSelected(droppedFile);
  }

  const iconColor = isDark ? "#7dd3fc" : "#9aabc9";
  const badgeClass = isDark
    ? "border-white/10 bg-white/10 text-slate-200"
    : "border-[var(--border)] bg-white/70 text-[var(--text-2)]";

  return (
    <div className={isFullscreen ? "" : "grad-ring"}>
      <div
        className={`flex items-start justify-center overflow-hidden pt-10 transition-shadow ${
          isFullscreen
            ? "fixed inset-0 z-[999] h-screen w-screen rounded-none"
            : "relative h-[380px] rounded-2xl sm:h-[460px]"
        } ${isDark ? "bg-[#0c1220] grid-canvas" : "bg-[#eef2f7] grid-canvas-light"} ${
          dragActive ? "drop-active" : ""
        }`}
        onDragEnter={(e) => handleDrag(e, true)}
        onDragOver={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
      >
        <div
          className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.3), transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.22), transparent 65%)" }}
        />

        {FLOATING_ICONS.map((icon, i) => (
          <svg
            key={i}
            className={isDark ? "absolute opacity-[0.06]" : "absolute opacity-[0.1]"}
            style={{ ...icon.style, color: iconColor }}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {icon.d ? (
              <path d={icon.d} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <g stroke="currentColor" fill="currentColor">
                {icon.extra}
              </g>
            )}
          </svg>
        ))}

        {/* Prepínač tmavého / svetlého pozadia náhľadu - najmä pri čiernych
            alebo tmavých modeloch je na tmavom pozadí zle vidno detaily. */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Prepnúť na svetlé pozadie" : "Prepnúť na tmavé pozadie"}
          className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur transition-colors ${
            isDark
              ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
              : "border-[var(--border)] bg-white/70 text-[var(--text-2)] hover:bg-white"
          }`}
        >
          {isDark ? (
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <circle cx={12} cy={12} r={4.5} stroke="currentColor" strokeWidth={1.7} />
              <path
                d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <path
                d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {loaded && (
          <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
            <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
              Veľkosť modelu na tlač
            </span>
            <div className="flex gap-1.5 rounded-full bg-black/50 p-1.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => stlViewerRef.current?.scaleModel(1.1)}
                title="Zväčšiť model o 10%"
                className="flex h-8 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                + Väčší
              </button>
              <button
                type="button"
                onClick={() => stlViewerRef.current?.scaleModel(0.9)}
                title="Zmenšiť model o 10%"
                className="flex h-8 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                − Menší
              </button>
              <button
                type="button"
                onClick={() => stlViewerRef.current?.rotateModel("y", 90)}
                title="Otočiť model o 90°"
                className="flex h-8 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                ↻ Otočiť
              </button>
            </div>
          </div>
        )}
        {(isFullscreen || (loaded && isViewable)) && (
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? "Zavrieť celoobrazovkový náhľad" : "Zväčšiť na celú obrazovku"}
            className={`absolute left-14 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur transition-colors ${
              isDark
                ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
                : "border-[var(--border)] bg-white/70 text-[var(--text-2)] hover:bg-white"
            }`}
          >
            {isFullscreen ? (
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        {!loaded && (
          <div className="animate-fade-in relative flex flex-col items-center px-6 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(56,189,248,0.22), rgba(37,99,235,0.14))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 16V4M12 4L7 9M12 4L17 9"
                  stroke="#bae6fd"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
                  stroke="#bae6fd"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className={`mb-1 text-sm font-semibold ${isDark ? "text-white" : "text-[var(--text-1)]"}`}>
              Presuňte sem .stl, .obj alebo .step súbor
            </p>
            <p className={`mb-5 text-xs ${isDark ? "text-slate-400" : "text-[var(--text-3)]"}`}>
              alebo vyberte súbor z počítača · max. 200 MB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all"
            >
              Nahrať 3D model
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".stl,.obj,.step,.stp,.3mf"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) onFileSelected(selected);
              }}
            />
            <div
              className={`mt-4 flex flex-col items-center gap-1 text-[11px] ${
                isDark ? "text-slate-400" : "text-[var(--text-3)]"
              }`}
            >
              <span>Model sa nedá nahrať alebo je poškodený? Skúste ho opraviť:</span>
              <span className="flex items-center gap-3">
                <a
                  href="https://www.justfixstl.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  JustFixSTL (zdarma, súbor sa nikam neposiela)
                </a>
                <span>·</span>
                <a
                  href="https://www.formware.co/onlinestlrepair"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  Formware (záložná možnosť)
                </a>
              </span>
            </div>
          </div>
        )}

        {loaded && file && (
          <div className="animate-fade-in absolute inset-0 flex items-center justify-center">
            {isViewable ? (
              <STLViewer
                ref={stlViewerRef}
                file={file}
                colorHex={colorHex}
                paintMode={paintMode}
                paintColorHex={paintColorHex}
                resetPaintSignal={resetPaintSignal}
                undoPaintSignal={undoPaintSignal}
                onDimensions={onDimensions}
                onError={onPreviewError}
                onPaintApplied={onPaintApplied}
              />
            ) : (
              <div className="relative flex flex-col items-center gap-3 px-6 text-center" style={{ perspective: 900 }}>
                <div
                  className="animate-spin-3d relative h-32 w-32 sm:h-40 sm:w-40"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: "translateZ(64px)",
                      border: "1px solid rgba(56,189,248,0.9)",
                      background: "linear-gradient(135deg, rgba(56,189,248,0.22), rgba(37,99,235,0.08))",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: "translateZ(-64px)",
                      border: "1px solid rgba(56,189,248,0.35)",
                      background: "rgba(56,189,248,0.05)",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: "rotateY(90deg) translateZ(64px)",
                      border: "1px solid rgba(37,99,235,0.75)",
                      background: "linear-gradient(135deg, rgba(37,99,235,0.18), transparent)",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: "rotateY(90deg) translateZ(-64px)",
                      border: "1px solid rgba(37,99,235,0.3)",
                      background: "rgba(37,99,235,0.05)",
                    }}
                  />
                </div>
                <p className={`mono max-w-[220px] text-[11px] ${isDark ? "text-slate-400" : "text-[var(--text-3)]"}`}>
                  Živý 3D náhľad je dostupný len pre .stl a .obj súbory
                </p>
              </div>
            )}

            {paintMode && isViewable && (
              <div
                className={`pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold backdrop-blur ${badgeClass}`}
              >
                Klikni na časť modelu, ktorú chceš prefarbiť
              </div>
            )}

            {/* Kompaktný panel s nástrojmi na maľovanie - zobrazí sa len v
                celoobrazovkovom náhľade, kde by inak bočný panel s nástrojmi
                nebol dostupný (je prekrytý). */}
            {isFullscreen && isViewable && onTogglePaintMode && (
              <div
                className={`absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur ${
                  isDark
                    ? "border-white/10 bg-black/50 text-white"
                    : "border-[var(--border)] bg-white/90 text-[var(--text-1)]"
                }`}
              >
                {onColorSelect && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="mr-1 text-xs font-semibold">Farba modelu</span>
                      {COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          title={color.label}
                          onClick={() => onColorSelect(color.id)}
                          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                            colorId === color.id ? "border-[var(--blue-2)]" : "border-transparent"
                          }`}
                          style={{ background: color.swatch }}
                        />
                      ))}
                    </div>
                    <span className={`h-5 w-px ${isDark ? "bg-white/20" : "bg-[var(--border)]"}`} />
                  </>
                )}

                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={paintMode}
                    onChange={(e) => onTogglePaintMode(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Viac farieb
                </label>

                {paintMode && (
                  <>
                    <span className={`h-5 w-px ${isDark ? "bg-white/20" : "bg-[var(--border)]"}`} />
                    <div className="flex items-center gap-1.5">
                      {COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          title={color.label}
                          onClick={() => onPaintColorSelect?.(color.id)}
                          className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                            paintColorId === color.id
                              ? "border-[var(--blue-2)]"
                              : "border-transparent"
                          }`}
                          style={{ background: color.swatch }}
                        />
                      ))}
                    </div>
                    <span className={`h-5 w-px ${isDark ? "bg-white/20" : "bg-[var(--border)]"}`} />
                    <button
                      type="button"
                      onClick={onUndoPaint}
                      disabled={!hasPaintedRegions}
                      title="Krok späť"
                      className="text-xs font-semibold disabled:opacity-40"
                    >
                      ↺ Krok späť
                    </button>
                    <button
                      type="button"
                      onClick={onResetPaint}
                      disabled={!hasPaintedRegions}
                      title="Vymazať maľovanie"
                      className="text-xs font-semibold text-red-500 disabled:opacity-40"
                    >
                      Vymazať
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onRemove}
              title="Odstrániť model"
              className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur transition-colors ${
                isDark
                  ? "border-white/10 bg-white/10 text-white hover:bg-red-500/30"
                  : "border-[var(--border)] bg-white/70 text-[var(--text-2)] hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className={`mono absolute bottom-3 left-3 z-10 rounded-lg border px-2.5 py-1 text-[11px] backdrop-blur ${badgeClass}`}>
              {file.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ModelViewer;
