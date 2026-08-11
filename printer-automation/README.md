# Automatické posielanie objednávok do tlačiarne

Tento priečinok je **samostatný Python skript**, ktorý beží na počítači
pri tlačiarni (nie na Verceli - webová stránka je bezserverová a nevie mať
prístup k vašej lokálnej sieti ani udržiavať bežiaci proces 24/7).

## Ako to funguje

```
zákazník objedná a zaplatí na webe
        |
        v
STL súbor sa uloží (Vercel Blob) + objednávka do databázy
        |
        v
tento skript sa pravidelne pýta: "je niečo nové na tlač?"
        |
        v
stiahne STL -> narezá na G-code -> pošle do tlačiarne cez lokálnu sieť
        |
        v
vy prídete k tlačiarni, založíte filament podľa objednávky, stlačíte tlačiť
```

## Čo je hotové a otestované
- Komunikácia s webovou appkou (`/api/print-queue`) - zoznam objednávok
  pripravených na tlač, označenie ako odoslané
- Sťahovanie STL súborov

## Čo NIE JE otestované naživo (nemám tu fyzickú tlačiareň ani slicer)
- **Presný príkaz na rezanie STL → G-code** (`slice_to_gcode()` v
  `print_queue_watcher.py`) - je tam len šablóna, presné parametre sa líšia
  podľa verzie Bambu Studio/OrcaSlicer. **Over si najprv ručne v termináli**,
  aký presný príkaz u teba funguje, potom uprav ten riadok v skripte.
- Pripojenie na tlačiareň cez `bambu-connect` - malo by fungovať podľa ich
  dokumentácie, ale over si to s jednou testovacou objednávkou predtým, než
  to necháš bežať bez dozoru.

## Nastavenie (krok za krokom)

1. **Nainštaluj Python 3.10+** (ak ešte nemáš): `python3 --version` v
   termináli, ak chýba, stiahni z python.org

2. **Nainštaluj závislosti:**
   ```bash
   cd printer-automation
   pip install -r requirements.txt
   ```

3. **Zisti údaje o tlačiarni** (priamo na displeji tlačiarne):
   - IP adresa: Nastavenia → WiFi
   - Sériové číslo a prístupový kód: Nastavenia → Zariadenie

4. **Vytvor konfiguračný súbor:**
   ```bash
   cp .env.example .env
   ```
   Otvor `.env` v textovom editore a doplň skutočné hodnoty (IP tlačiarne,
   sériové číslo, prístupový kód, cestu k slicer CLI, a `ORDERS_VIEW_KEY` -
   **to isté heslo**, čo máte nastavené vo Vercel Environment Variables).

5. **Over si ručne, aký príkaz na rezanie STL u teba funguje** - skús si v
   termináli spustiť svoj nainštalovaný slicer s `--help`, nájdi správne
   flagy na headless rezanie, a uprav `command = [...]` v
   `print_queue_watcher.py` (funkcia `slice_to_gcode`).

6. **Spusti skript:**
   ```bash
   python print_queue_watcher.py
   ```
   Nechaj bežať v termináli (alebo ho spusti ako pozadový proces / službu,
   ak chceš aby bežal aj po zatvorení terminálu).

## Bezpečnosť

- Súbor `.env` obsahuje heslá a prístupové kódy - **nikdy ho neposielaj na
  GitHub** (je v `.gitignore`, takže sa to nestane omylom, ale buď opatrná
  aj pri kopírovaní priečinka inam).
- `ORDERS_VIEW_KEY` je to isté tajné heslo, čo chráni aj `/api/orders` -
  ak ho niekedy zmeníte vo Verceli, treba ho zmeniť aj tu v `.env`.
