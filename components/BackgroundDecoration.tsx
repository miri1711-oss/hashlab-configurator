import { CSSProperties } from "react";

interface DecoIcon {
  style: CSSProperties;
  viewBox: string;
  paths: string[];
  delay: string;
  opacity: number;
  extra?: JSX.Element;
}

// Rozptýlené jemné obrysy 3D-tlačených objektov (hexagóny, kocky, vlnovky...),
// presne podľa pozícií a tvarov z pôvodného návrhu.
const ICONS: DecoIcon[] = [
  {
    style: { left: "3%", top: "4%", width: 150, height: 150, opacity: 0.05 },
    viewBox: "0 0 64 64",
    paths: ["M32 4L58 18V46L32 60L6 46V18L32 4Z", "M32 4V60M6 18L32 32M58 18L32 32"],
    delay: "0s",
    opacity: 0.05,
  },
  {
    style: { right: "5%", top: "10%", width: 100, height: 100 },
    viewBox: "0 0 64 64",
    paths: ["M32 8v8M32 48v8M8 32h8M48 32h8"],
    delay: "1.2s",
    opacity: 0.06,
    extra: <circle cx={32} cy={32} r={24} stroke="currentColor" strokeWidth={1.6} />,
  },
  {
    style: { left: "8%", top: "26%", width: 64, height: 64 },
    viewBox: "0 0 64 64",
    paths: ["M14 26h36M26 14v36"],
    delay: "2.4s",
    opacity: 0.055,
    extra: <rect x={14} y={14} width={36} height={36} rx={5} stroke="currentColor" strokeWidth={1.6} />,
  },
  {
    style: { right: "12%", top: "32%", width: 120, height: 120 },
    viewBox: "0 0 64 64",
    paths: ["M12 6h40l6 12-26 40L6 18l6-12Z", "M6 18h52M20 6l12 40M44 6L32 46"],
    delay: "0.6s",
    opacity: 0.05,
  },
  {
    style: { left: "44%", top: "5%", width: 70, height: 70 },
    viewBox: "0 0 64 64",
    paths: ["M8 32c6-12 12-12 18 0s12 12 18 0 12-12 18 0"],
    delay: "1.8s",
    opacity: 0.055,
  },
  {
    style: { left: "38%", top: "42%", width: 105, height: 105 },
    viewBox: "0 0 64 64",
    paths: ["M14 56c0-10 8-18 18-18s18 8 18 18"],
    delay: "3s",
    opacity: 0.045,
    extra: <circle cx={32} cy={24} r={10} stroke="currentColor" strokeWidth={1.6} />,
  },
  {
    style: { right: "4%", top: "52%", width: 90, height: 90 },
    viewBox: "0 0 64 64",
    paths: ["M32 6L56 20V44L32 58L8 44V20L32 6Z"],
    delay: "0.9s",
    opacity: 0.055,
  },
  {
    style: { left: "1%", top: "56%", width: 60, height: 60 },
    viewBox: "0 0 64 64",
    paths: ["M26 44h12"],
    delay: "2.1s",
    opacity: 0.05,
    extra: <rect x={18} y={10} width={28} height={44} rx={6} stroke="currentColor" strokeWidth={1.6} />,
  },
  {
    style: { right: "22%", top: "66%", width: 74, height: 74 },
    viewBox: "0 0 64 64",
    paths: ["M32 4L58 18V46L32 60L6 46V18L32 4Z", "M18 26h28M18 32h28M18 38h20"],
    delay: "1.5s",
    opacity: 0.05,
  },
  {
    style: { left: "16%", top: "72%", width: 130, height: 130 },
    viewBox: "0 0 64 64",
    paths: [],
    delay: "2.7s",
    opacity: 0.045,
    extra: (
      <>
        <circle cx={32} cy={32} r={26} stroke="currentColor" strokeWidth={1.4} strokeDasharray="4 4" />
        <circle cx={32} cy={32} r={16} stroke="currentColor" strokeWidth={1.6} />
      </>
    ),
  },
  {
    style: { right: "8%", top: "80%", width: 64, height: 64 },
    viewBox: "0 0 64 64",
    paths: [],
    delay: "0.3s",
    opacity: 0.06,
    extra: (
      <>
        <rect x={10} y={10} width={20} height={20} rx={3} stroke="currentColor" strokeWidth={1.6} />
        <rect x={34} y={34} width={20} height={20} rx={3} stroke="currentColor" strokeWidth={1.6} />
        <rect x={34} y={10} width={20} height={20} rx={3} stroke="currentColor" strokeWidth={1.6} />
      </>
    ),
  },
  {
    style: { left: "50%", top: "82%", width: 80, height: 80 },
    viewBox: "0 0 64 64",
    paths: [],
    delay: "1.9s",
    opacity: 0.05,
    extra: (
      <path
        d="M6 3h12l3 6-9 12L3 9l3-6Z"
        transform="translate(18,20) scale(1.2)"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    ),
  },
  {
    style: { right: "38%", top: "2%", width: 50, height: 50 },
    viewBox: "0 0 64 64",
    paths: ["M12 32l20-20 20 20-20 20-20-20Z"],
    delay: "2.9s",
    opacity: 0.05,
  },
  {
    style: { left: "26%", top: "90%", width: 56, height: 56 },
    viewBox: "0 0 64 64",
    paths: [
      "M32 14v8M32 42v8M14 32h8M42 32h8M20 20l6 6M44 44l-6-6M44 20l-6 6M20 44l6-6",
    ],
    delay: "0.4s",
    opacity: 0.05,
    extra: <circle cx={32} cy={32} r={18} stroke="currentColor" strokeWidth={1.6} />,
  },
  {
    style: { right: "46%", top: "92%", width: 100, height: 100 },
    viewBox: "0 0 64 64",
    paths: ["M32 4L58 18V46L32 60L6 46V18L32 4Z"],
    delay: "1.1s",
    opacity: 0.045,
  },
  {
    style: { left: "60%", top: "24%", width: 46, height: 46 },
    viewBox: "0 0 64 64",
    paths: [],
    delay: "2.2s",
    opacity: 0.05,
    extra: <rect x={14} y={14} width={36} height={36} rx={18} stroke="currentColor" strokeWidth={1.6} />,
  },
  {
    style: { right: "2%", top: "2%", width: 56, height: 56 },
    viewBox: "0 0 64 64",
    paths: ["M32 6L56 20V44L32 58L8 44V20L32 6Z", "M32 6V58"],
    delay: "3.4s",
    opacity: 0.05,
  },
];

export default function BackgroundDecoration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {ICONS.map((icon, i) => (
        <svg
          key={i}
          className="absolute text-[var(--blue-2)] animate-float"
          style={{ ...icon.style, opacity: icon.opacity, animationDelay: icon.delay }}
          viewBox={icon.viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {icon.paths.map((d, j) => (
            <path key={j} d={d} stroke="currentColor" strokeWidth={1.6} />
          ))}
          {icon.extra}
        </svg>
      ))}
    </div>
  );
}
