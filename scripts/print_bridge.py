"""
print_bridge.py - lokalny "mostik" medzi hashlab.sk objednavkami a tlaciarnou.

CO TENTO SKRIPT ROBI (plne automaticky, ak su splnene podmienky nizsie):

1. Pravidelne kontroluje web (/api/print-queue), ci nepribudla nova
   zaplatena objednavka.
2. Stiahne skutocny STL subor.
3. NAREZE ho automaticky (headless slicing cez Bambu Studio CLI) - pouzije
   material a vyplnu z objednavky, s automatickym generovanim podpier
   (auto-supports - bezna, spolahliva funkcia slicera).
4. Hotovy narezany subor automaticky POSLE do tlaciarne cez lokalnu siet
   (kniznica bambu-connect).
5. Oznaci objednavku ako spracovanu.

AK sa pre danu objednavku nenajde spravny profil (napr. material "Ultra
Detail / Resin" - to sa NEDA tlacit na FDM Bambu tlaciarni, je to iny typ
tlaciarne), skript ju PRESKOCI a necha STL subor v `na_vytlacenie/` na
rucne vyriesenie - nepokusi sa hadat nespravne nastavenia.

===============================================================================
PRED PRVYM POUZITIM - POVINNA PRIPRAVA (bez tohto to nebude fungovat):
===============================================================================

1. OrcaSlicer NIE JE potrebny - pouzivame priamo Bambu Studio, ktoru uz mas

2. V Bambu Studio si over/nastav svoj bezne pouzivany profil pre tvoju
   tlaciarnu (Bambu P1S / X1C / A1 - podla toho, aku mas), VRATANE:
   - zapnuteho auto-generovania podpier (Support > Support ON)
   - kalibracie, ktoru bezne pouzivas (tie iste hodnoty, co pouzivas pri
     rucnom tlaceni doteraz)

3. EXPORTUJ tieto profily z Bambu Studio (Printer/Filament/Process settings
   > tlacidlo "..." > Export) a ulož ich presne do priecinka
   `scripts/profiles/` pod tymito nazvami:

   profiles/machine.json                 <- profil tvojej tlaciarne
   profiles/filament_standard.json       <- PLA (Standardny plast)
   profiles/filament_durable.json        <- PETG (Odolny plast)
   profiles/filament_outdoor.json        <- ASA (Exterier & Teplo)
   profiles/filament_flex.json           <- TPU (Pruzny gumeny)
   profiles/process_light.json           <- proces s vyplnou 15 % (Lahka)
   profiles/process_standard.json        <- proces s vyplnou 30 % (Standardna)
   profiles/process_strong.json          <- proces s vyplnou 80 % (Pevna)

   POZNAMKA: Material "Ultra Detail" (Resin) NEMA profil - resin sa nedá
   tlačiť na FDM Bambu tlačiarni (je to úplne iný typ tlačiarne/technológie).
   Objednávky s týmto materiálom skript vždy preskočí na ručné spracovanie.

4. Nastav cestu k Bambu Studio (ak nie je na štandardnom mieste) a údaje o
   tlačiarni - pozri sekciu NASTAVENIA nižšie.

5. Prvý test urob s AUTO_SEND_TO_PRINTER = False (bezpečná poistka) a
   najprv over si výsledné narezané súbory v priečinku `narezane/` ručne
   v Bambu Studio (otvor .gcode.3mf a skontroluj náhľad), než pustíš ostrý
   režim.

AKO TO SPUSTIT:
    pip install requests bambu-connect
    python3 print_bridge.py
"""

import json
import os
import shutil
import subprocess
import time
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# NASTAVENIA - uprav podla seba
# ---------------------------------------------------------------------------

SITE_URL = "https://hashlab-configurator.vercel.app"
ORDERS_VIEW_KEY = os.environ.get("HASHLAB_ORDERS_KEY", "SEM_DAJ_SVOJE_HESLO")

OUTPUT_DIR = Path(__file__).parent / "na_vytlacenie"
SLICED_DIR = Path(__file__).parent / "narezane"
SLICED_ARCHIVE_DIR = SLICED_DIR / "odoslane"
PROFILES_DIR = Path(__file__).parent / "profiles"

POLL_INTERVAL_SECONDS = 30

# --- Nastavenia tlaciarne (Bambu Connect) -----------------------------------

# POISTKA: kym je False, skript vsetko nareze aj vypise, co by poslal, ale
# NIC neposle do tlaciarne. Prepni na True az ked si overis prve narezane
# subory rucne v Bambu Studio.
AUTO_SEND_TO_PRINTER = False

PRINTER_IP = os.environ.get("PRINTER_IP", "192.168.1.25")
PRINTER_ACCESS_CODE = os.environ.get("PRINTER_ACCESS_CODE", "dfc7eca6")
PRINTER_SERIAL = os.environ.get("PRINTER_SERIAL", "01P00C5A2501890")

# --- Nastavenia slicera (Bambu Studio CLI) ------------------------------------

# Bezna cesta na macOS. Bambu Studio ma uplne rovnake CLI ako OrcaSlicer
# (OrcaSlicer je jeho fork), takze staci len tato cesta. Ak mas appku inde,
# uprav (alebo nastav cez premennu prostredia SLICER_PATH).
SLICER_PATH = os.environ.get(
    "SLICER_PATH", "/Applications/BambuStudio.app/Contents/MacOS/BambuStudio"
)

MACHINE_PROFILE = PROFILES_DIR / "machine.json"

# Mapovanie nazvu materialu (presne ako je v objednavke) na exportovany
# filament profil. "Ultra Detail" (Resin) umyselne chyba - nepodporovane.
MATERIAL_TO_FILAMENT_PROFILE = {
    "Štandardný plast": PROFILES_DIR / "filament_standard.json",
    "Odolný plast": PROFILES_DIR / "filament_durable.json",
    "Exteriér & Teplo": PROFILES_DIR / "filament_outdoor.json",
    "Pružný gumený": PROFILES_DIR / "filament_flex.json",
}

# Mapovanie nazvu vyplne na exportovany process profil.
INFILL_TO_PROCESS_PROFILE = {
    "Ľahká": PROFILES_DIR / "process_light.json",
    "Štandardná": PROFILES_DIR / "process_standard.json",
    "Pevná": PROFILES_DIR / "process_strong.json",
}

SLICING_TIMEOUT_SECONDS = 300

# ---------------------------------------------------------------------------


def fetch_print_queue() -> list[dict]:
    url = f"{SITE_URL}/api/print-queue?key={ORDERS_VIEW_KEY}"
    with urllib.request.urlopen(url, timeout=15) as response:
        data = json.loads(response.read().decode("utf-8"))
    if not data.get("ok"):
        raise RuntimeError(f"Server odpovedal chybou: {data}")
    return data.get("orders", [])


def mark_as_sent(order_id: str) -> None:
    url = f"{SITE_URL}/api/print-queue?key={ORDERS_VIEW_KEY}"
    payload = json.dumps({"orderId": order_id, "printStatus": "sent_to_printer"}).encode("utf-8")
    request = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}, method="PATCH"
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        json.loads(response.read().decode("utf-8"))


def safe_filename_part(text: str) -> str:
    keep = "-_. "
    return "".join(c if c.isalnum() or c in keep else "_" for c in text).strip()


def download_stl(order: dict) -> Path:
    OUTPUT_DIR.mkdir(exist_ok=True)

    order_id = order["id"]
    material = safe_filename_part(order.get("material_name", "material"))
    color = safe_filename_part(order.get("color_label", "farba"))
    infill = safe_filename_part(order.get("infill_label", "vyplna"))
    quantity = order.get("quantity", 1)
    paint_note = "-viacfarebny" if order.get("has_custom_paint") else ""

    local_filename = f"{order_id}_{material}_{color}_{infill}_{quantity}ks{paint_note}.stl"
    local_path = OUTPUT_DIR / local_filename

    model_url = order["model_file_url"]
    urllib.request.urlretrieve(model_url, local_path)
    return local_path


def profiles_ready() -> bool:
    """Over, ci su exportovane vsetky potrebne profily zo slicera."""
    if not Path(SLICER_PATH).exists():
        return False
    if not MACHINE_PROFILE.exists():
        return False
    all_filament = all(p.exists() for p in MATERIAL_TO_FILAMENT_PROFILE.values())
    all_process = all(p.exists() for p in INFILL_TO_PROCESS_PROFILE.values())
    return all_filament and all_process


def slice_stl(stl_path: Path, material_name: str, infill_label: str) -> Path | None:
    """
    Automaticky nareze STL na hotovy .gcode.3mf pomocou Bambu Studio CLI,
    s auto-generovanim podpier (podla nastavenia v exportovanom process
    profile). Vrati cestu k vysledku, alebo None, ak material/vyplna nema
    priradeny profil (napr. Resin) alebo rezanie zlyhalo.
    """
    filament_profile = MATERIAL_TO_FILAMENT_PROFILE.get(material_name)
    process_profile = INFILL_TO_PROCESS_PROFILE.get(infill_label)

    if not filament_profile or not process_profile:
        print(
            f"[slicing] PRESKAKUJEM {stl_path.name}: nie je priradeny profil pre "
            f"material='{material_name}' / vyplna='{infill_label}' "
            f"(napr. Resin sa neda tlacit na FDM tlaciarni - vybav rucne)"
        )
        return None

    if not profiles_ready():
        print(
            "[slicing] CHYBA: chyba Bambu Studio alebo niektory profil v "
            "priecinku scripts/profiles/ - pozri navod na zaciatku suboru."
        )
        return None

    SLICED_DIR.mkdir(exist_ok=True)
    output_path = SLICED_DIR / f"{stl_path.stem}.gcode.3mf"

    cmd = [
        SLICER_PATH,
        "--orient", "1",
        "--arrange", "1",
        "--slice", "1",
        "--load-settings", f"{MACHINE_PROFILE};{process_profile}",
        "--load-filaments", str(filament_profile),
        "--allow-newer-file",
        "--export-3mf", str(output_path),
        str(stl_path),
    ]

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=SLICING_TIMEOUT_SECONDS
        )
    except subprocess.TimeoutExpired:
        print(f"[slicing] CHYBA: rezanie {stl_path.name} trvalo prilis dlho (timeout).")
        return None

    if result.returncode != 0 or not output_path.exists():
        print(f"[slicing] CHYBA pri rezani {stl_path.name}:")
        print(f"    {result.stderr[:800]}")
        return None

    print(f"[slicing] OK narezane -> {output_path.name}")
    return output_path


def send_file_to_printer(gcode_path: Path) -> None:
    from bambu_connect import BambuClient

    client = BambuClient(PRINTER_IP, PRINTER_ACCESS_CODE, PRINTER_SERIAL)
    client.send_print_job(str(gcode_path))


def process_order_queue() -> None:
    orders = fetch_print_queue()
    if not orders:
        return

    for order in orders:
        order_id = order["id"]
        try:
            local_path = download_stl(order)
            print(f"[objednavky] OK {order_id}: stiahnute -> {local_path.name}")
            print(
                f"    material: {order.get('material_name')}  |  "
                f"farba: {order.get('color_label')}  |  "
                f"vyplna: {order.get('infill_label')}  |  "
                f"kusy: {order.get('quantity')}"
            )

            sliced_path = slice_stl(
                local_path, order.get("material_name", ""), order.get("infill_label", "")
            )

            if sliced_path is None:
                # Nepodarilo sa automaticky narezat (chybajuci profil alebo
                # chyba) - subor ostava v na_vytlacenie/ na rucne spracovanie,
                # objednavku NEOZNACUJEME ako hotovu.
                continue

            if AUTO_SEND_TO_PRINTER:
                send_file_to_printer(sliced_path)
                shutil.move(str(sliced_path), str(SLICED_ARCHIVE_DIR / sliced_path.name))
                print(f"[tlaciaren] OK odoslane do tlaciarne: {sliced_path.name}")
            else:
                print(
                    f"[tlaciaren] (vypnute) Nastav AUTO_SEND_TO_PRINTER = True, "
                    f"aby sa poslalo: {sliced_path.name}"
                )

            mark_as_sent(order_id)
        except Exception as exc:  # noqa: BLE001
            print(f"[objednavky] CHYBA {order_id}: {exc}")


def process_sliced_folder() -> None:
    """
    Zalozny rucny postup: ak si niektory subor narezala sama v Bambu Studio
    (napr. pre objednavku, ktoru automatika preskocila) a ulozila do
    `narezane/`, skript ho aj tak posle do tlaciarne.
    """
    SLICED_DIR.mkdir(exist_ok=True)
    SLICED_ARCHIVE_DIR.mkdir(exist_ok=True)

    for gcode_path in sorted(SLICED_DIR.glob("*.gcode.3mf")):
        if not AUTO_SEND_TO_PRINTER:
            continue
        try:
            print(f"[tlaciaren] Odosielam (rucne narezane): {gcode_path.name}")
            send_file_to_printer(gcode_path)
            shutil.move(str(gcode_path), str(SLICED_ARCHIVE_DIR / gcode_path.name))
            print(f"[tlaciaren] OK - odoslane a archivovane: {gcode_path.name}")
        except Exception as exc:  # noqa: BLE001
            print(f"[tlaciaren] CHYBA pri odosielani {gcode_path.name}: {exc}")


def print_startup_info() -> None:
    print(f"Sledujem nove objednavky na {SITE_URL} (kazdych {POLL_INTERVAL_SECONDS}s)")
    print(f"  STL subory:      {OUTPUT_DIR.resolve()}")
    print(f"  Narezane subory: {SLICED_DIR.resolve()}")
    if profiles_ready():
        print("  Automaticke rezanie (Bambu Studio CLI): PRIPRAVENE")
    else:
        print(
            "  Automaticke rezanie: NIE JE PRIPRAVENE - chyba Bambu Studio alebo "
            "profily v scripts/profiles/ (pozri navod na zaciatku suboru). "
            "Objednavky sa budu len stahovat, nie automaticky rezat."
        )
    if AUTO_SEND_TO_PRINTER:
        print(f"  Odosielanie do tlaciarne: ZAPNUTE -> {PRINTER_IP}")
    else:
        print("  Odosielanie do tlaciarne: VYPNUTE (AUTO_SEND_TO_PRINTER = False)")
    print("Ukonci cez Ctrl+C.\n")


def main() -> None:
    if ORDERS_VIEW_KEY == "SEM_DAJ_SVOJE_HESLO":
        print(
            "! Najprv nastav ORDERS_VIEW_KEY - bud priamo v tomto subore, "
            "alebo cez `export HASHLAB_ORDERS_KEY=tvoje-heslo` pred spustenim."
        )
        return

    if AUTO_SEND_TO_PRINTER and "SEM_DAJ" in (PRINTER_IP + PRINTER_ACCESS_CODE + PRINTER_SERIAL):
        print(
            "! AUTO_SEND_TO_PRINTER je zapnute, ale chybaju udaje o tlaciarni "
            "(PRINTER_IP / PRINTER_ACCESS_CODE / PRINTER_SERIAL). Doplň ich."
        )
        return

    print_startup_info()

    while True:
        try:
            process_order_queue()
            process_sliced_folder()
        except Exception as exc:  # noqa: BLE001
            print(f"! Chyba v hlavnej slucke: {exc}")
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
