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

## Databáza objednávok, Packeta a platba kartou

### Databáza (funguje, treba len 1x nastaviť vo Verceli)

Objednávky sa teraz ukladajú do skutočnej databázy (Postgres cez
`@vercel/postgres`), nielen zobrazujú v prehliadači. Kód je hotový
(`lib/db.ts`, `app/api/orders/route.ts`), ale **databázu treba raz vytvoriť
priamo vo Vercel dashboarde** (par klikov, nie je to v kóde):

1. `vercel.com/dashboard` → tvoj projekt → záložka **Storage**
2. **Create Database** → vyber **Postgres** (bezplatný tier stačí na začiatok)
3. Po vytvorení klikni **Connect Project** a vyber tento projekt
   (`hashlab-configurator`) - Vercel automaticky pridá potrebné premenné
   prostredia (`POSTGRES_URL` a pod.), netreba nič ručne kopírovať
4. V **Settings → Environment Variables** pridaj ešte jednu vlastnú
   premennú: `ORDERS_VIEW_KEY` = ľubovoľné tajné heslo podľa výberu
   (slúži na prezeranie zoznamu objednávok, pozri nižšie)
5. Redeploy projektu (aby sa nové premenné prejavili)

Tabuľka `orders` sa vytvorí **automaticky** pri prvej uloženej objednávke
(žiadny ručný SQL netreba spúšťať).

**Ako si šéf pozrie objednávky:** `https://hashlab-configurator.vercel.app/api/orders?key=TAJNE_HESLO`
(to isté heslo, čo si nastavila v `ORDERS_VIEW_KEY`). Vráti to zoznam v JSON
formáte - je to zámerne jednoduché dočasné riešenie bez prihlasovacej
obrazovky; pekná admin stránka sa dá doplniť neskôr.

### Packeta (výdajné miesta)

V kroku "Spôsob dopravy" pribudla možnosť **"Výdajné miesto (Packeta)"**.
Momentálne je výber výdajného miesta **len textové pole** (zákazník napíše
adresu ručne) - je to zámerne dočasné, pretože skutočný výber cez Packeta
mapu/widget vyžaduje API kľúč od Packeta (Zásielkovňa), ktorý si musí
založiť niekto z firmy (vyžaduje obchodné/fakturačné údaje, nedá sa založiť
programovo). Keď bude kľúč k dispozícii, nahradenie textového poľa
skutočným Packeta widgetom je malá zmena v `components/CheckoutFlow.tsx`.

### Platba kartou - teraz cez Stripe (skutočná integrácia)

Platba kartou je teraz **naozaj napojená na Stripe** (`app/api/checkout-session/route.ts`
vytvorí platobnú reláciu, `app/api/stripe-webhook/route.ts` automaticky
označí objednávku v databáze ako zaplatenú, keď Stripe potvrdí úspešnú
platbu). Kód je hotový, ale treba doň vložiť **skutočné Stripe kľúče** -
tie musí získať niekto s prístupom k firemnému Stripe účtu:

1. **Založenie účtu:** `dashboard.stripe.com` → Sign up (ak ešte nemáte účet)
2. **Získanie API kľúčov:** Stripe dashboard → **Developers → API keys**
   - Skopíruj **Secret key** (začína `sk_test_...` pre testovací režim,
     alebo `sk_live_...` pre ostrý)
3. **Vo Verceli** (`Settings → Environment Variables`) pridaj:
   - `STRIPE_SECRET_KEY` = ten secret key z kroku 2
4. **Nastavenie webhooku** (aby sa objednávky automaticky označili ako
   zaplatené): Stripe dashboard → **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://hashlab-configurator.vercel.app/api/stripe-webhook`
     (alebo doména firemného repozitára, keď tam bude nasadené)
   - Event: vyber **`checkout.session.completed`**
   - Po vytvorení skopíruj **Signing secret** (začína `whsec_...`)
5. **Vo Verceli** pridaj ešte jednu premennú:
   - `STRIPE_WEBHOOK_SECRET` = ten signing secret z kroku 4
6. **Redeploy** projektu (aby sa nové premenné prejavili)

**Odporúčanie:** najprv otestujte s testovacími kľúčmi (`sk_test_...`) a
testovacou kartou `4242 4242 4242 4242` (ľubovoľný budúci dátum, ľubovoľné
CVC) - Stripe v testovacom režime nič reálne neúčtuje. Až keď všetko
funguje, prepnite na `sk_live_...` kľúč pre skutočné platby.

**Ako to funguje pre zákazníka:** vyplní objednávku → zvolí "Platobná
karta" → klikne "Záväzne objednať" → presmeruje sa na Stripe platobnú
stránku → po úspešnej platbe sa vráti na `/objednavka-uspech`. Objednávka sa
v databáze automaticky označí ako `status: "paid"` (cez webhook), takže
šéf v prehľade objednávok (`/api/orders?key=...`) uvidí, ktoré objednávky
sú skutočne zaplatené.

## Prepojenie s tlačiarňou (Bambu Lab) - plná automatizácia tlače

Cieľ: zákazník zaplatí objednávku → STL sa **automaticky nareže** (výber
materiálu, výplne, auto-podpery) → hotový súbor sa **automaticky pošle**
tlačiarni cez sieť → ty už len založíš filament a stlačíš tlačiť.

**Čo je hotové:**
- Skutočný STL súbor sa ukladá (nie len jeho názov) - do Vercel Blob
  storage pri odoslaní objednávky (`app/api/upload-stl/route.ts`, volá sa z
  `CheckoutFlow.tsx`). URL súboru je v databáze (`lib/db.ts`, stĺpec
  `model_file_url`).
- Objednávky majú stav tlače (`print_status`) - `"pending"` kým čaká,
  `"sent_to_printer"` po spracovaní.
- `app/api/print-queue/route.ts` - `GET` vráti nespracované zaplatené
  objednávky, `PATCH` označí objednávku ako hotovú.
- `scripts/print_bridge.py` - beží na počítači **pri tlačiarni** (tá istá
  lokálna sieť) a pre každú novú objednávku:
  1. Stiahne STL súbor
  2. **Automaticky ho nareže** cez `Bambu Studio` v headless (CLI) režime,
     s automatickým generovaním podpier (auto-supports - bežná, spoľahlivá
     funkcia slicera)
  3. Hotový výsledok **automaticky pošle tlačiarni** cez lokálnu sieť
     (knižnica [`bambu-connect`](https://pypi.org/project/bambu-connect))

**Dôležitá výnimka - materiál "Ultra Detail" (Resin):** Resin sa fyzicky
**nedá tlačiť na FDM Bambu tlačiarni** (je to úplne iný typ tlačiarne -
SLA/živicová). Objednávky s týmto materiálom skript vždy preskočí a nechá
súbor v `na_vytlacenie/` na ručné vyriešenie (napr. poslať inému
dodávateľovi s resin tlačiarňou, alebo zákazníkovi navrhnúť iný materiál).

### Prečo je potrebný jednorazový export profilov z Bambu Studio

Narezanie potrebuje presné nastavenia **tvojej konkrétnej tlačiarne**
(rozmery podložky, teploty, kalibrácia) - tie sa nedajú len tak "uhádnuť"
zvonka. Preto sa **raz** vyexportujú tie isté profily, čo už bežne
používaš a poznáš ako funkčné.

### Nastavenie krok za krokom

**1. Príprava tlačiarne** (raz, na dotykovej obrazovke):
   - Zapni **Developer Mode**
   - Zapni **LAN Only mode**, over si **IP adresu**, **Access Code**,
     **sériové číslo**

**2. OrcaSlicer netreba** - používame priamo Bambu Studio, ktorú už máš nainštalovanú

**3. V Bambu Studio priprav a exportuj profily** (Printer/Filament/Process
   nastavenia → tlačidlo "..." → Export), s **zapnutými auto-podperami**
   (Support → Support ON), a ulož ich presne do `scripts/profiles/` pod
   týmito názvami:
   ```
   profiles/machine.json                 - profil tvojej tlačiarne
   profiles/filament_standard.json       - PLA (Štandardný plast)
   profiles/filament_durable.json        - PETG (Odolný plast)
   profiles/filament_outdoor.json        - ASA (Exteriér & Teplo)
   profiles/filament_flex.json           - TPU (Pružný gumený)
   profiles/process_light.json           - výplň 15 % (Ľahká)
   profiles/process_standard.json        - výplň 30 % (Štandardná)
   profiles/process_strong.json          - výplň 80 % (Pevná)
   ```
   (Ultra Detail/Resin zámerne nemá profil - pozri vyššie.)

**4. Inštalácia a nastavenie skriptu:**
```bash
cd scripts
pip install requests bambu-connect

export HASHLAB_ORDERS_KEY="rovnaké heslo ako ORDERS_VIEW_KEY vo Verceli"
export PRINTER_IP="192.168.x.x"
export PRINTER_ACCESS_CODE="12345678"
export PRINTER_SERIAL="01P00A000000000"
```

**5. Prvý test naprázdno** (`AUTO_SEND_TO_PRINTER = False`, predvolené) -
   spusti `python3 print_bridge.py`, počkaj na testovaciu objednávku,
   **ručne otvor výsledný `.gcode.3mf` v Bambu Studio a skontroluj náhľad**
   (orientáciu, podpery, či to vyzerá rozumne) - až keď si istá, že to
   vyzerá dobre, pokračuj ďalej.

**6. Zapni ostrý režim:**
```bash
python3 print_bridge.py
```
(v súbore nastav `AUTO_SEND_TO_PRINTER = True`, alebo cez terminál:
`sed -i '' 's/AUTO_SEND_TO_PRINTER = False/AUTO_SEND_TO_PRINTER = True/' print_bridge.py`)

### Ako to funguje v praxi

1. Zákazník zaplatí → skript stiahne, automaticky nareže a pošle do
   tlačiarne bez zásahu
2. Ty prídeš k tlačiarni, založíš filament podľa toho, čo ukazuje
   tlačový front na obrazovke, a stlačíš tlačiť
3. **Výnimka:** ak objednávka má materiál bez profilu (Resin) alebo
   rezanie z nejakého dôvodu zlyhá, súbor ostane v `na_vytlacenie/` a
   objednávka sa neoznačí ako hotová - vybavíš ju ručne (narežeš sama a
   uložíš do `narezane/`, skript to aj tak pošle do tlačiarne)

**Poznámka:** `bambu-connect` a headless CLI Bambu Studio sú nezávislé
(neoficiálne/menej zdokumentované) nástroje, nie oficiálne API od Bambu Lab.
Ak sa po aktualizácii zmenia príkazy, pozri si aktuálnu dokumentáciu:
https://github.com/mattcar15/bambu-connect a
https://github.com/bambulab/BambuStudio/wiki/Command-Line-Usage.


## Kontaktný formulár (Resend)

Stránka `/kontakt` umožňuje zákazníkom poslať otázku - správa sa odošle
emailom na `mirkap1711@gmail.com` (nastavené v `app/api/contact/route.ts`,
konštanta `CONTACT_RECIPIENT` - zmeň, keď budete chcieť prejsť na šéfov
email).

**Nastavenie (jednorazovo, vo Verceli):**
1. Zaregistruj sa na [resend.com](https://resend.com) (má bezplatný plán)
2. V dashboarde vytvor **API Key**
3. Vo Verceli: **Settings → Environment Variables** → pridaj `RESEND_API_KEY`
   s hodnotou tohto kľúča (Production + Preview)
4. Redeploy

**Dôležité obmedzenie zadarmo:** kým si neoveríte vlastnú doménu v Resend,
dá sa posielať len z ich testovacej adresy (`onboarding@resend.dev`) - to
v kóde už je nastavené a funguje to na posielanie na `mirkap1711@gmail.com`
bez ďalšieho nastavovania. Ak by ste chceli posielať z vlastnej adresy
(napr. `info@hashlab.sk`), treba v Resend overiť doménu `hashlab.sk`
(pridanie DNS záznamov) - vtedy uprav aj `from` pole v `route.ts`.

## Nahrávanie .obj súborov a výber výšky vrstvy

- Konfigurátor teraz prijíma okrem `.stl` aj `.obj` súbory - 3D náhľad,
  výpočet rozmerov aj maľovanie farieb fungujú pre oba formáty rovnako
  (`components/STLViewer.tsx` používa `OBJLoader` pre `.obj` a zlúči
  viacero objektov v súbore do jednej geometrie).
- Pribudol nový krok výberu **výšky vrstvy** (`components/LayerHeightPanel.tsx`,
  hodnoty v `lib/constants.ts` → `LAYER_HEIGHTS`) - hodnota `0.2 mm` je
  označená ako odporúčaná/predvolená. Vybraná hodnota sa ukladá k objednávke
  (stĺpec `layer_height_label`) a zobrazuje sa aj v prehľade objednávky.

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
  `floodFillRegion`, prah 55°, tolerancia zhody vrcholov 0,001 mm - STL
  súradnice majú z podstaty formátu obmedzenú presnosť, príliš prísna zhoda
  by drobné susediace časti modelu vyhodnotila ako nedotýkajúce sa a
  rozbila by výber na malé kúsky). Farbenie funguje cez vertex colors
  (`MeshStandardMaterial({ vertexColors: true })`), takže nepotrebuje druhý
  súbor ani predpripravené oddelené časti modelu.
- **"Krok späť" pri maľovaní** - vráti len posledné kliknutie (nie celú
  stránku). Toto je zámerne oddelené od šípky "späť" v prehliadači, ktorá je
  funkcia prehliadača mimo kontroly appky a pri jednostránkovej aplikácii by
  vždy vrátila na úplný začiatok - preto má appka vlastné tlačidlo namiesto
  spoliehania sa na prehliadač.
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

## Automatizované testy

Projekt má testy pre najcitlivejšiu logiku - výpočet ceny (peniaze) a
"inteligentný výber plochy" pri maľovaní farieb na modeli (algoritmus).
Testovací framework je [Vitest](https://vitest.dev) (rýchly, štandard pre
Next.js projekty).

**Spustenie:**
```bash
npm install
npm test
```

**Čo je otestované:**
- `lib/pricing.test.ts` - výpočet ceny (objem × cena materiálu × výplň),
  minimálna cena objednávky, množstevná zľava (aj hraničný prípad "presne na
  prahu"), formátovanie eur
- `lib/paint.test.ts` - flood-fill výber plochy pri kliknutí na model:
  overuje, že sa výber správne "zastaví" na ostrej hrane (napr. medzi QR
  kódom a stojanom) a nerozleje sa na celý model

**Čo (zatiaľ) otestované nie je** - dobré ďalšie kroky, ak budete chcieť
pokračovať:
- Formulár objednávky (`CheckoutFlow.tsx`) - vyžaduje React Testing Library
- API endpointy (`/api/orders`, `/api/checkout-session`) - vyžaduje mock
  databázy a Stripe
- End-to-end test celého nákupného flow (Playwright) - simuluje skutočného
  používateľa v prehliadači od nahratia súboru po platbu

Tieto testy sa dajú doplniť neskôr, keď bude čas - momentálne pokrývajú tú
časť kódu, kde by chyba stála najviac (nesprávna cena, zle vyfarbený model).

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
