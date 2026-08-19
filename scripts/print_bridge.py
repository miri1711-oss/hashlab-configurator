from __future__ import annotations
"""
print_bridge.py - lokalny "mostik" medzi hashlab.sk objednavkami a tlaciarnou.

CO TENTO SKRIPT ROBI:
1. Pravidelne kontroluje web (/api/print-queue), ci nepribudla nova
   zaplatena objednavka.
2. Stiahne skutocny STL subor do priecinka `na_vytlacenie/`.
3. AUTOMATICKY OTVORI model v Bambu Studio, pripraveny na narezanie.

CO UZ NIE JE AUTOMATICKE (a preco):
Narezanie (slicing) a odoslanie do tlaciarne ostava rucny krok (klikni
"Slice" a "Print" v Bambu Studio). Skusali sme plnu automatizaciu cez
headless (na pozadi bezice) rezanie, ale ukazalo sa, ze tento sposob
negeneruje spravne instrukcie pre vyber materialu z AMS - tlaciaren by
nevedela, ktory filament pouzit, aj ked su cievky v AMS spravne zalozene.
Toto je realne obmedzenie samotneho nastroja (Bambu Studio CLI), nie
niecoho, co sa da jednoducho opravit z nasej strany.

Preto: system automaticky stiahne a otvori model, cloveka uz len treba na
posledne 2 kliky (Slice + Print) - odpada rucne hladanie suborov po
emailoch/databaze.

AKO TO SPUSTIT:
    pip install requests
    python3 print_bridge.py
"""

import json
import os
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

POLL_INTERVAL_SECONDS = 30

# Nazov aplikacie tak, ako ho pozna macOS (Launch Services). Ak by sa
# aplikacia neotvorila, over si presny nazov v /Applications.
BAMBU_STUDIO_APP_NAME = os.environ.get("BAMBU_STUDIO_APP_NAME", "Bambu Studio")

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

    # Ak zakaznik pouzil viacfarebne malovanie a mame k dispozicii hotovy
    # farebny .3mf subor (Standard 3MF, oficialny format), pouzijeme
    # PREDNOSTNE ten - Bambu Studio ho otvori uz vyfarbeny, netreba
    # domalovat rucne. Ak z nejakeho dovodu nie je k dispozicii, padneme
    # spat na obycajny STL (bez farieb, treba domalovat podla obrazku).
    colored_threemf_url = order.get("colored_threemf_url")
    if colored_threemf_url:
        local_filename = f"{order_id}_{material}_{color}_{infill}_{quantity}ks{paint_note}.3mf"
        local_path = OUTPUT_DIR / local_filename
        urllib.request.urlretrieve(colored_threemf_url, local_path)
    else:
        local_filename = f"{order_id}_{material}_{color}_{infill}_{quantity}ks{paint_note}.stl"
        local_path = OUTPUT_DIR / local_filename
        model_url = order["model_file_url"]
        urllib.request.urlretrieve(model_url, local_path)

    # Obrazok toho, ako ma byt model vyfarbeny, stiahneme VZDY, ked bolo
    # pouzite malovanie - aj ked mame uz vyfarbeny .3mf, sluzi ako zaloha
    # pre pripad, ze by sa .3mf v Bambu Studio otvoril nespravne.
    paint_preview_url = order.get("paint_preview_url")
    if paint_preview_url:
        preview_path = local_path.with_name(local_path.stem + "_FARBY.png")
        try:
            urllib.request.urlretrieve(paint_preview_url, preview_path)
        except Exception as exc:  # noqa: BLE001
            print(f"[objednavky] UPOZORNENIE: nepodarilo sa stiahnut obrazok farieb pre {order_id}: {exc}")

    return local_path


def open_in_bambu_studio(stl_path: Path) -> None:
    """
    Otvori STL subor priamo v Bambu Studio (spusti appku, ak este nebezi).
    Clovek uz len nastavi material/farbu/vyplnu podla nazvu suboru,
    klikne Slice a Print - appka (naziva pripojena k tlaciarni) sama
    zabezpeci spravny vyber materialu z AMS.
    """
    subprocess.run(
        ["open", "-n", "-a", "/Applications/BambuStudio.app", str(stl_path)],
        check=True,
    )


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
                f"vyska vrstvy: {order.get('layer_height_label', '0.2 mm')}  |  "
                f"kusy: {order.get('quantity')}"
            )
            if order.get("colored_threemf_url"):
                print(
                    f"    ✓ FAREBNY .3MF - model by sa mal otvorit uz vyfarbeny "
                    f"(over si to, obrazok je zaloha ak by farby nesedeli)"
                )
            elif order.get("paint_preview_url"):
                preview_name = local_path.stem + "_FARBY.png"
                print(
                    f"    !! VIACFAREBNY MODEL (bez hotoveho 3mf) - pozri obrazok "
                    f"{preview_name} a domaluj farby rucne v Bambu Studio"
                )
            open_in_bambu_studio(local_path)
            print(f"[bambu] Otvorene v Bambu Studio -> {local_path.name}")
            print("[bambu] Teraz uz len: nastav material/farbu/vyplnu, Slice, Print.")
            mark_as_sent(order_id)
        except Exception as exc:  # noqa: BLE001
            print(f"[objednavky] CHYBA {order_id}: {exc}")


def print_startup_info() -> None:
    print(f"Sledujem nove objednavky na {SITE_URL} (kazdych {POLL_INTERVAL_SECONDS}s)")
    print(f"  STL subory: {OUTPUT_DIR.resolve()}")
    print(f"  Pri novej objednavke sa automaticky otvori Bambu Studio s modelom.")
    print("Ukonci cez Ctrl+C.\n")


def main() -> None:
    if ORDERS_VIEW_KEY == "SEM_DAJ_SVOJE_HESLO":
        print(
            "! Najprv nastav ORDERS_VIEW_KEY - bud priamo v tomto subore, "
            "alebo cez `export HASHLAB_ORDERS_KEY=tvoje-heslo` pred spustenim."
        )
        return

    print_startup_info()

    while True:
        try:
            process_order_queue()
        except Exception as exc:  # noqa: BLE001
            print(f"! Chyba v hlavnej slucke: {exc}")
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
