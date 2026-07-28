import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        spin3d: {
          from: { transform: "rotateX(-22deg) rotateY(0deg)" },
          to: { transform: "rotateX(-22deg) rotateY(360deg)" },
        },
        pulseDot: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.45)" },
          "50%": { boxShadow: "0 0 0 6px rgba(16,185,129,0)" },
        },
        floatDeco: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" },
        },
      },
      animation: {
        "fade-in": "fadeIn .3s ease both",
        "spin-3d": "spin3d 14s linear infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        float: "floatDeco 10s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
