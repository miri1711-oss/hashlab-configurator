"""
print_queue_watcher.py
=======================

Beží NA POČÍTAČI PRI TLAČIARNI (nie na Verceli - Vercel je bezserverový a
nevie udržiavať dlhobežiaci proces ani mať prístup k vašej lokálnej sieti,
kde je tlačiareň). Tento skript:

1. Pravidelne sa pýta hashlab-configurator API, či nepribudla nová
   zaplatená objednávka, ktorá ešte nebola poslaná do tlačiarne.
2. Stiahne STL súbor tej objednávky.
3. Narezá ho na G-code (headless, cez príkazový riadok slicera).
4. Pošle hotový súbor do tlačiarne cez lokálnu sieť (MQTT/FTP).
5. Označí objednávku v databáze ako "sent_to_printer", aby sa neposlala
   znova.

DÔLEŽITÉ - toto som nemohla naživo otestovať (nemám tu fyzickú tlačiareň
ani nainštalovaný slicer) - najmä krok 3 (presný príkaz na rezanie) sa
takmer isto bude musieť doladiť podľa toho, akú presnú verziu Bambu Studio
/ OrcaSlicer máte nainštalovanú. Zvyšok (komunikácia s API, sťahovanie
súborov, označovanie ako odoslané) je jednoduchá logika, ktorá by mala
fungovať bez úprav.

Spustenie:
    pip install -r requirements.txt
    cp .env.example .env   # a doplň skutočné hodnoty
    python print_queue_watcher.py
"""

import os
import subprocess
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

ORDERS_API_URL = os.environ["ORDERS_API_URL"].rstrip("/")
ORDERS_VIEW_KEY = os.environ["ORDERS_VIEW_KEY"]
PRINTER_IP = os.environ["PRINTER_IP"]
PRINTER_SERIAL = os.environ["PRINTER_SERIAL"]
PRINTER_ACCESS_CODE = os.environ["PRINTER_ACCESS_CODE"]
SLICER_CLI_PATH = os.environ.get("SLICER_CLI_PATH", "")
POLL_INTERVAL_SECONDS = int(os.environ.get("POLL_INTERVAL_SECONDS", "60"))

DOWNLOAD_DIR = Path(__file__).parent / "downloads"
SLICED_DIR = Path(__file__).parent / "sliced"
DOWNLOAD_DIR.mkdir(exist_ok=True)
SLICED_DIR.mkdir(exist_ok=True)


def fetch_print_queue() -> list[dict]:
    """Zoznam objednávok pripravených na tlač (zaplatené/dobierka, ešte
    neposlané do tlačiarne)."""
    response = requests.get(
        f"{ORDERS_API_URL}/api/print-queue",
        params={"key": ORDERS_VIEW_KEY},
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("ok"):
        raise RuntimeError(f"API vrátilo chybu: {data}")
    return data.get("orders", [])


def mark_as_sent(order_id: str) -> None:
    """Označí objednávku ako poslanú do tlačiarne, nech sa neposiela znova."""
    response = requests.patch(
        f"{ORDERS_API_URL}/api/print-queue",
        params={"key": ORDERS_VIEW_KEY},
        json={"orderId": order_id, "printStatus": "sent_to_printer"},
        timeout=15,
    )
    response.raise_for_status()


def download_stl(url: str, order_id: str) -> Path:
    """Stiahne STL súbor objednávky na disk."""
    target = DOWNLOAD_DIR / f"{order_id}.stl"
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    target.write_bytes(response.content)
    return target


def slice_to_gcode(stl_path: Path, order: dict) -> Path:
    """
    Narezá STL na G-code pripravený na tlač, cez príkazový riadok slicera.

    POZOR: presné parametre príkazu (--load profilu, --arrange, atď.) sa
    LÍŠIA podľa verzie Bambu Studio / OrcaSlicer a podľa toho, aké profily
    (materiál, výplň) máte uložené. Toto je len ŠABLÓNA na doplnenie - over
    si presný príkaz najprv ručne v termináli, potom uprav tento riadok.

    Materiál a výplň z objednávky (order["material_name"],
    order["infill_label"]) treba namapovať na názvy vašich uložených
    profilov v slicerovi.
    """
    output_path = SLICED_DIR / f"{order['id']}.gcode.3mf"

    if not SLICER_CLI_PATH:
        raise RuntimeError(
            "SLICER_CLI_PATH nie je nastavený v .env - bez neho sa nedá "
            "automaticky narezať STL súbor."
        )

    # --- TOTO JE MIESTO, KTORÉ TREBA DOLADIŤ PODĽA VAŠEJ INŠTALÁCIE ---
    command = [
        SLICER_CLI_PATH,
        "--slice", "1",
        "--export-3mf", str(output_path),
        str(stl_path),
    ]
    # --------------------------------------------------------------

    result = subprocess.run(command, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(
            f"Rezanie zlyhalo (kód {result.returncode}):\n{result.stderr}"
        )
    if not output_path.exists():
        raise RuntimeError("Slicer dobehol, ale výstupný súbor sa nenašiel.")

    return output_path


def send_to_printer(gcode_path: Path) -> None:
    """Pošle hotový G-code súbor do tlačiarne cez lokálnu sieť."""
    # Import je až tu, aby skript vedel aspoň sťahovať/rezať aj bez toho,
    # že by mal knižnicu bambu-connect hneď od začiatku nainštalovanú.
    from bambu_connect import BambuClient  # type: ignore

    client = BambuClient(
        ip_address=PRINTER_IP,
        serial=PRINTER_SERIAL,
        access_code=PRINTER_ACCESS_CODE,
    )
    client.send_print_job(str(gcode_path))


def process_order(order: dict) -> None:
    order_id = order["id"]
    file_url = order.get("model_file_url")

    if not file_url:
        print(f"[{order_id}] preskakujem - chýba model_file_url.")
        return

    print(f"[{order_id}] sťahujem STL...")
    stl_path = download_stl(file_url, order_id)

    print(f"[{order_id}] režem na G-code...")
    gcode_path = slice_to_gcode(stl_path, order)

    print(f"[{order_id}] posielam do tlačiarne...")
    send_to_printer(gcode_path)

    print(f"[{order_id}] hotovo - označujem ako odoslané.")
    mark_as_sent(order_id)


def main() -> None:
    print("Sledujem tlačovú frontu... (Ctrl+C pre ukončenie)")
    while True:
        try:
            orders = fetch_print_queue()
            if not orders:
                print("Žiadne nové objednávky na tlač.")
            for order in orders:
                try:
                    process_order(order)
                except Exception as exc:  # noqa: BLE001
                    # Jedna pokazená objednávka nesmie zastaviť celú frontu.
                    print(f"[{order.get('id')}] CHYBA: {exc}")
        except Exception as exc:  # noqa: BLE001
            print(f"Chyba pri kontrole tlačovej fronty: {exc}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
