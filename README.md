# Hashlab — Konfigurátor 3D tlače (Next.js + TypeScript)

Next.js (App Router) + TypeScript + Tailwind CSS verzia pôvodnej statickej
HTML stránky `3d-print-konfigurator-blue_1.html`. Funkcionalita aj vizuál sú
zachované 1:1, kód je rozdelený na komponenty a typovaný.

## Štruktúra projektu

```
app/
  layout.tsx        – root layout, fonty, metadata
  page.tsx           – hlavná stránka, drží stav konfigurátora
  globals.css         – Tailwind + pôvodné CSS triedy/premenné
components/
  BackgroundDecoration.tsx  – ambientné SVG pozadie
  Header.tsx                – logo + indikátor krokov 1-2-3
  ModelViewer.tsx            – drag&drop nahrávanie + 3D kocka
  InfoPanel.tsx               – rozmery a stav pripravenosti modelu
  MaterialPanel.tsx           – výber materiálu (PLA/PETG/ASA/TPU/Resin)
  ColorPanel.tsx               – výber farby
  InfillPanel.tsx               – výber pevnosti (výplne)
  QuantityPanel.tsx              – počet kusov
  CheckoutFooter.tsx              – cena, doručenie, tlačidlo pokračovať
lib/
  types.ts     – TypeScript typy
  constants.ts  – materiály, farby, výplne, cenové konštanty
  pricing.ts     – výpočet ceny, rozmerov a dátumu doručenia
```

## Spustenie

Tento sandbox nemá prístup na internet, takže `npm install` treba spustiť
lokálne u teba:

```bash
npm install
npm run dev
```

Stránka pobeží na [http://localhost:3000](http://localhost:3000).

## Skutočný 3D náhľad (three.js)

Pri nahratí **.stl** súboru sa model reálne parsuje a vykresľuje pomocou
`three.js` (`components/STLViewer.tsx`), s ovládaním myšou (rotácia/zoom cez
OrbitControls). Rozmery (X/Y/Z) aj objem sa počítajú priamo z geometrie
súboru (`lib/stl.ts`) — nie sú to už náhodné čísla ako v pôvodnom prototype.

Formáty **.step/.stp** three.js priamo neparsuje (je to úplne iný formát
súborov než STL), takže pre ne zostáva zobrazená animovaná náhrada s
upozornením, že živý náhľad nie je k dispozícii — a rozmery sa naďalej
odhadujú (`estimateDimensions()` v `lib/pricing.ts`).

## Farba modelu, maľovanie viacerých farieb a tmavý/svetlý náhľad

- **Farba sa reálne aplikuje na 3D náhľad.** Kliknutie na farebný swatch
  prefarbí materiál modelu priamo (`STLViewer.tsx` má samostatný, ľahký
  `useEffect` len na zmenu farby - nemusí sa kvôli tomu nanovo parsovať celý
  STL súbor). Mapovanie farba → hex hodnota je v `lib/constants.ts`
  (`COLOR_HEX`).
- **Viac farieb na jednom modeli** (`components/PaintPanel.tsx`) - namiesto
  nahrávania druhého STL súboru sa dá zapnúť "maľovací" režim a **kliknúť
  priamo na model**. Klik vyberie celú súvislú plochu okolo miesta kliku
  (napr. celý QR kód), nie len jeden bod - výber sa "rozleje" po susedných
  trojuholníkoch siete, kým nenarazí na ostrú hranu (`lib/paint.ts`,
  `floodFillRegion`, prah 35°). Farbenie funguje cez vertex colors
  (`MeshStandardMaterial({ vertexColors: true })`), takže nepotrebuje druhý
  súbor ani predpripravené oddelené časti modelu.
- **Prepínač tmavého/svetlého pozadia náhľadu** (ikona slnko/mesiac vľavo
  hore v 3D okne) - pri čiernych alebo tmavých modeloch je na pôvodnom
  tmavom pozadí zle vidno detaily, svetlé pozadie to rieši.

## Order flow (krok 3 - Platba)

Pôvodný HTML prototyp mal tlačidlo "Pokračovať", ktoré len prepínalo indikátor
na krok 3 bez akéhokoľvek obsahu. Doplnené o funkčný flow
(`components/CheckoutFlow.tsx`):

1. **Kontaktné a doručovacie údaje** - meno, email, telefón, adresa, so
   základnou validáciou povinných polí a formátu emailu
2. **Spôsob dopravy** - kuriér (4,90 €) / osobný odber (zdarma)
3. **Spôsob platby** - karta / prevod / dobierka (len výber, bez reálnej
   platobnej brány)
4. **Súhrn objednávky** - materiál, farba, výplň, počet kusov, cena vrátane
   dopravy
5. **Potvrdzujúca obrazovka** - vygenerované číslo objednávky, rekapitulácia,
   možnosť začať novú objednávku

**Toto je predbežná implementácia** podľa štandardného e-shop flow - nie je
napojená na žiadnu platobnú bránu ani backend (objednávka sa nikam
neodosiela, len sa zobrazí potvrdenie v prehliadači). Ak máte vo firme
zdokumentovaný presný order flow (Figma, interná dokumentácia a pod.), tento
krok bude potrebné podľa neho upraviť.

## Poznámky k portovaniu

- Pôvodný vanilla-JS stav (`document.getElementById(...)`, manuálne
  triedy) je nahradený React stavom (`useState`) v `app/page.tsx`, ktorý sa
  posúva do komponentov cez typované props.
- Náhodné "namerané" rozmery modelu (simulácia analýzy STL/STEP súboru) sú
  zachované presne podľa originálu — pozri `lib/pricing.ts` →
  `estimateDimensions()`.
- Cenový vzorec (min. cena 4,90 €, zľava −5 % od 5 ks, DPH ×1.2) je 1:1
  prenesený do `lib/pricing.ts` → `calculateTotalPrice()`.
- Animácie (`fade-in`, `spin-3d`, `pulse-dot`, `float`) sú definované v
  `tailwind.config.ts` ako Tailwind `animate-*` utility triedy namiesto
  ručných `@keyframes` v `<style>`.
- Google Fonts (Space Grotesk, Inter, IBM Plex Mono) sa načítavajú cez
  `<link>` v `app/layout.tsx` rovnako ako v origináli.
