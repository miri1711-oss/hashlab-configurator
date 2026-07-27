"use client";

import { DragEvent, useRef, useState } from "react";

interface ModelViewerProps {
  fileName: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

const FLOATING_ICONS: { style: React.CSSProperties; d?: string; extra?: JSX.Element }[] = [
  {
    style: { left: "6%", bottom: "8%", width: 90, height: 90 },
    extra: (
      <>
        <circle cx={32} cy={32} r={22} stroke="#7dd3fc" strokeWidth={2} />
        <path d="M32 10v8M32 46v8M10 32h8M46 32h8" stroke="#7dd3fc" strokeWidth={2} />
      </>
    ),
  },
  { style: { right: "8%", top: "12%", width: 70, height: 70 }, d: "M32 6L56 20V44L32 58L8 44V20L32 6Z" },
  {
    style: { right: "20%", bottom: "14%", width: 56, height: 56 },
    extra: (
      <>
        <rect x={10} y={10} width={44} height={44} rx={6} stroke="#7dd3fc" strokeWidth={2} />
        <path d="M10 24h44M24 10v44" stroke="#7dd3fc" strokeWidth={2} />
      </>
    ),
  },
  { style: { left: "22%", top: "20%", width: 44, height: 44 }, d: "M8 32c6-12 12-12 18 0s12 12 18 0 12-12 18 0" },
  {
    style: { left: "6%", top: "22%", width: 34, height: 34 },
    extra: (
      <>
        <circle cx={32} cy={32} r={22} stroke="#7dd3fc" strokeWidth={2} />
        <circle cx={32} cy={32} r={6} fill="#7dd3fc" />
      </>
    ),
  },
  {
    style: { right: "32%", bottom: "20%", width: 40, height: 40 },
    d: "M6 3h12l3 6-9 12L3 9l3-6Z",
  },
  {
    style: { left: "40%", bottom: "8%", width: 48, height: 48 },
    extra: (
      <>
        <rect x={14} y={6} width={20} height={32} rx={5} stroke="#7dd3fc" strokeWidth={2} />
        <path d="M20 32h8" stroke="#7dd3fc" strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  { style: { right: "44%", top: "8%", width: 30, height: 30 }, d: "M12 32l20-20 20 20-20 20-20-20Z" },
];

export default function ModelViewer({ fileName, onFileSelected, onRemove }: ModelViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const loaded = Boolean(fileName);

  function handleDrag(e: DragEvent<HTMLDivElement>, active: boolean) {
    e.preventDefault();
    setDragActive(active);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div className="grad-ring">
      <div
        className={`relative flex h-[380px] items-center justify-center overflow-hidden rounded-2xl bg-[#0c1220] grid-canvas transition-shadow sm:h-[460px] ${
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
            className="absolute opacity-[0.06]"
            style={icon.style}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {icon.d ? <path d={icon.d} stroke="#7dd3fc" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : icon.extra}
          </svg>
        ))}

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
            <p className="mb-1 text-sm font-semibold text-white">Presuňte sem .stl alebo .step súbor</p>
            <p className="mb-5 text-xs text-slate-400">alebo vyberte súbor z počítača · max. 200 MB</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all"
            >
              Nahrať 3D model
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".stl,.step,.stp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelected(file);
              }}
            />
          </div>
        )}

        {loaded && (
          <div className="animate-fade-in absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ perspective: 900 }}>
              <div
                className="animate-spin-3d relative h-36 w-36 sm:h-48 sm:w-48"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: "translateZ(76px)",
                    border: "1px solid rgba(56,189,248,0.9)",
                    background: "linear-gradient(135deg, rgba(56,189,248,0.22), rgba(37,99,235,0.08))",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    transform: "translateZ(-76px)",
                    border: "1px solid rgba(56,189,248,0.35)",
                    background: "rgba(56,189,248,0.05)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    transform: "rotateY(90deg) translateZ(76px)",
                    border: "1px solid rgba(37,99,235,0.75)",
                    background: "linear-gradient(135deg, rgba(37,99,235,0.18), transparent)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    transform: "rotateY(90deg) translateZ(-76px)",
                    border: "1px solid rgba(37,99,235,0.3)",
                    background: "rgba(37,99,235,0.05)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    transform: "rotateX(90deg) translateZ(76px)",
                    border: "1px solid rgba(125,211,252,0.7)",
                    background: "linear-gradient(135deg, rgba(125,211,252,0.16), transparent)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    transform: "rotateX(90deg) translateZ(-76px)",
                    border: "1px solid rgba(125,211,252,0.3)",
                    background: "rgba(125,211,252,0.05)",
                  }}
                />
              </div>
            </div>
            <button
              onClick={onRemove}
              title="Odstrániť model"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
              </svg>
            </button>
            <div className="mono absolute bottom-3 left-3 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-slate-200 backdrop-blur">
              {fileName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
