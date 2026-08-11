"""
print_bridge.py - lokalny "mostik" medzi hashlab.sk objednavkami a tlaciarnou.

CO TENTO SKRIPT ROBI (2 kroky):

KROK 1 - Stahovanie objednavok
  Pravidelne sa pyta webu (/api/print-queue), ci nepribudla nova zaplatena
  objednavka. Pre kazdu stiahne skutocny STL subor do priecinka
  `na_vytlacenie/` s prehladnym nazvom (cislo objednavky, material, farba,
  vyplna, pocet kusov) a oznaci ju vo webovej databaze ako spracovanu.

KROK 2 - Odoslanie do tlaciarne (Bambu Connect)
  STL sa neda tlacit priamo - musi sa najprv "narezat" (slicing) na G-code
  v Bambu Studio / OrcaSlicer podla materialu/farby/vyplne z nazvu suboru.
  Toto ostava ZAMERNE rucne (zle nastavenie slicera moze znehodnotit tlac).

  Ked narezes STL a ulozis vysledny .gcode.3mf do priecinka `narezane/`
  POD ROVNAKYM NAZVOM ako mal STL (len s inou priponou), skript ho
  automaticky odosle do tlaciarne cez lokalnu siet (kniznica bambu-connect)
  a presunie ho do `narezane/odoslane/`, aby sa neposlal druhykrat.

  Priklad:
    na_vytlacenie/HL-2026-5059_Standardny_plast_Antracitova_Lahka_1ks.stl
    -> narezes v Bambu Studio ->
    narezane/HL-2026-5059_Standardny_plast_Antracitova_Lahka_1ks.gcode.3mf

DOLEZITE - PRED PRVYM POUZITIM:
1. Na tlaciarni zapni "Developer Mode" a "LAN Only mode"
   (Nastavenia na dotykovej obrazovke tlaciarne).
2. Zisti si IP adresu, Access Code a seriove cislo tlaciarne
   (tiez v nastaveniach tlaciarne, alebo Bambu Studio > Device).
3. Nastav PRINTER_IP / PRINTER_ACCESS_CODE / PRINTER_SERIAL nizsie
   (najlepsie cez premenne prostredia, nie natvrdo v subore).
4. Odosielanie do tlaciarne je VYPNUTE, kym rucne nenastavis
   AUTO_SEND_TO_PRINTER = True nizsie - je to poistka, aby sa nic
   neposlalo do tlace, kym si si isty, ze vsetko funguje spravne.

AKO TO SPUSTIT:
    pip install requests bambu-connect
    python3 print_bridge.py

Skript bezi donekonecna a kontroluje oba priecinky kazdych 30 sekund
(Ctrl+C na ukoncenie).
"""

import json
import os
import shutil
import time
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# NASTAVENIA - uprav podla seba
# ---------------------------------------------------------------------------

# Adresa tvojej appky na Verceli (bez lomitka na konci).
SITE_URL = "https://hashlab-configurator.vercel.app"

# Rovnake tajne heslo, ake mas nastavene ako ORDERS_VIEW_KEY vo Verceli.
ORDERS_VIEW_KEY = os.environ.get("HASHLAB_ORDERS_KEY", "SEM_DAJ_SVOJE_HESLO")

# Kam sa maju ukladat stiahnute STL subory pripravene na tlac.
OUTPUT_DIR = Path(__file__).parent / "na_vytlacenie"

# Kam davas narezane (.gcode.3mf) subory, aby sa poslali do tlaciarne.
SLICED_DIR = Path(__file__).parent / "narezane"
SLICED_ARCHIVE_DIR = SLICED_DIR / "odoslane"

# Ako casto (v sekundach) sa ma skript pytat na nove objednavky / kontrolovat
# priecinok s narezanymi subormi.
POLL_INTERVAL_SECONDS = 30

# --- Nastavenia tlaciarne (Bambu Connect) -----------------------------------

# POISTKA: kym je False, skript STIAHNE objednavky a bude sledovat priecinok
# `narezane/`, ale NIC neposle do tlaciarne - len vypise, co by poslal.
# Prepni na True az ked si overis, ze vsetko ostatne funguje spravne.
AUTO_SEND_TO_PRINTER = False

PRINTER_IP = os.environ.get("PRINTER_IP", "192.168.1.25")
PRINTER_ACCESS_CODE = os.environ.get("PRINTER_ACCESS_CODE", "dfc7eca6")
PRINTER_SERIAL = os.environ.get("PRINTER_SERIAL", "01P00C5A2501890")

# ---------------------------------------------------------------------------


def fetch_print_queue() -> list[dict]:
    """Stiahne zoznam objednavok cakajucich na tlac."""
    url = f"{SITE_URL}/api/print-queue?key={ORDERS_VIEW_KEY}"
    with urllib.request.urlopen(url, timeout=15) as response:
        data = json.loads(response.read().decode("utf-8"))
    if not data.get("ok"):
        raise RuntimeError(f"Server odpovedal chybou: {data}")
    return data.get("orders", [])


def mark_as_sent(order_id: str) -> None:
    """Oznaci objednavku, aby sa nabuduce znova nespracovala."""
    url = f"{SITE_URL}/api/print-queue?key={ORDERS_VIEW_KEY}"
    payload = json.dumps({"orderId": order_id, "printStatus": "sent_to_printer"}).encode("utf-8")
    request = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}, method="PATCH"
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        json.loads(response.read().decode("utf-8"))


def safe_filename_part(text: str) -> str:
    """Odstrani znaky, ktore nie su bezpecne v nazve suboru."""
    keep = "-_. "
    return "".join(c if c.isalnum() or c in keep else "_" for c in text).strip()


def download_stl(order: dict) -> Path:
    """Stiahne STL subor objednavky a ulozi ho s prehladnym menom."""
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


def process_order_queue() -> None:
    """KROK 1 - stiahnutie novych zaplatenych objednavok."""
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
                f"kusy: {order.get('quantity')}  |  "
                f"doprava: {order.get('shipping_method')}"
            )
            mark_as_sent(order_id)
        except Exception as exc:  # noqa: BLE001 - chceme pokracovat aj pri chybe jednej objednavky
            print(f"[objednavky] CHYBA {order_id}: {exc}")


def send_file_to_printer(gcode_path: Path) -> None:
    """
    KROK 2 - posle uz narezany .gcode.3mf subor do tlaciarne cez lokalnu
    siet pomocou kniznice bambu-connect.

    Poznamka: bambu-connect je nezavisly (neoficialny) projekt tretej strany.
    Ak sa nazov metody v novsej verzii kniznice mierne lisi, pozri si
    priklady v jej repozitari: https://github.com/mattcar15/bambu-connect
    (priecinok `examples/`).
    """
    from bambu_connect import BambuClient  # import az tu, aby skript fungoval

    client = BambuClient(PRINTER_IP, PRINTER_ACCESS_CODE, PRINTER_SERIAL)
    client.send_print_job(str(gcode_path))


def process_sliced_folder() -> None:
    """KROK 2 - kontrola priecinka narezane/ a odoslanie do tlaciarne."""
    SLICED_DIR.mkdir(exist_ok=True)
    SLICED_ARCHIVE_DIR.mkdir(exist_ok=True)

    sliced_files = sorted(SLICED_DIR.glob("*.gcode.3mf"))
    if not sliced_files:
        return

    for gcode_path in sliced_files:
        if not AUTO_SEND_TO_PRINTER:
            print(
                f"[tlaciaren] (vypnute) Nastav AUTO_SEND_TO_PRINTER = True, "
                f"aby sa poslalo: {gcode_path.name}"
            )
            continue

        try:
            print(f"[tlaciaren] Odosielam do tlaciarne: {gcode_path.name}")
            send_file_to_printer(gcode_path)
            shutil.move(str(gcode_path), str(SLICED_ARCHIVE_DIR / gcode_path.name))
            print(f"[tlaciaren] OK - odoslane a archivovane: {gcode_path.name}")
        except ImportError:
            print(
                "[tlaciaren] CHYBA: kniznica 'bambu-connect' nie je "
                "nainstalovana. Spusti: pip install bambu-connect"
            )
        except Exception as exc:  # noqa: BLE001
            print(f"[tlaciaren] CHYBA pri odosielani {gcode_path.name}: {exc}")


def print_startup_info() -> None:
    print(f"Sledujem nove objednavky na {SITE_URL} (kazdych {POLL_INTERVAL_SECONDS}s)")
    print(f"  STL subory:      {OUTPUT_DIR.resolve()}")
    print(f"  Narezane subory: {SLICED_DIR.resolve()}")
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
