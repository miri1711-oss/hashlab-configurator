import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hashlab — Konfigurátor 3D tlače",
  description: "Nahrajte 3D model, vyberte materiál, farbu a pevnosť a získajte okamžitú cenu tlače.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
