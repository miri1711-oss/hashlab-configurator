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

NOVE - ZIVY STAV TLACIARNE PRE ZAKAZNIKOV:
Skript sa (ak su nastavene PRINTER_IP/PRINTER_ACCESS_CODE/PRINTER_SERIAL)
navyse pripoji priamo na tlaciareň (rovnaky pristupovy kod ako pri LAN
Only Mode) a pravidelne posiela webu, ci prave tlaci a co je zalozene v
AMS - toto sa potom zobrazuje zakaznikom este pred objednavkou. Vyzaduje
kniznicu paho-mqtt (pip install paho-mqtt). Ak tieto premenne nie su
nastavene, tato cast sa jednoducho vynecha, zvysok skriptu funguje ako
doteraz.

AKO TO SPUSTIT:
    pip install requests paho-mqtt
    export PRINTER_IP="192.168.1.25"
    export PRINTER_ACCESS_CODE="tvoj-pristupovy-kod"
    export PRINTER_SERIAL="tvoje-seriove-cislo"
    python3 print_bridge.py
"""

import json
import os
import ssl
import subprocess
import threading
import time
import urllib.request
from pathlib import Path

try:
    import paho.mqtt.client as mqtt

    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False

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

# Pripojenie priamo na tlaciaren (pre zivy stav/AMS pre zakaznikov) -
# NEPOVINNE, ak chybaju, tato cast sa jednoducho vynecha.
PRINTER_IP = os.environ.get("PRINTER_IP", "")
PRINTER_ACCESS_CODE = os.environ.get("PRINTER_ACCESS_CODE", "")
PRINTER_SERIAL = os.environ.get("PRINTER_SERIAL", "")
PRINTER_ID = os.environ.get("PRINTER_ID", "hlavna")  # nazov v appke

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


def _hex_from_bambu_color(color8: str) -> str:
    """Bambu farby su 8-znakove RRGGBBAA - appke stac RRGGBB s '#' na zaciatku."""
    if not color8 or len(color8) < 6:
        return "#cccccc"
    return f"#{color8[:6]}"


def _post_printer_status(is_printing, job_name, progress_percent, ams_slots) -> None:
    try:
        payload = json.dumps(
            {
                "printerId": PRINTER_ID,
                "isPrinting": is_printing,
                "currentJobName": job_name,
                "progressPercent": progress_percent,
                "amsSlots": ams_slots,
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            f"{SITE_URL}/api/printer-status?key={ORDERS_VIEW_KEY}",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as exc:  # noqa: BLE001
        print(f"[tlaciaren] Nepodarilo sa poslat stav appke: {exc}")


# Tlaciaren neposiela vzdy KOMPLETNY stav v kazdej MQTT sprave - niektore
# spravy obsahuju napr. len info o AMS, bez informacie o tom, ci sa prave
# tlaci. Preto si stav "skladame" postupne (aktualizujeme len to, co prave
# prislo, zvysok si pamatame z predoslych sprav) - inak by sa mohlo stat,
# ze appka nahodne odosle neuplnu spravu a nespravne ukaze "volna" aj ked
# tlaciaren prave tlaci.
_state_lock = threading.Lock()
_current_state = {
    "gcode_state": None,
    "job_name": None,
    "progress": None,
    "ams_slots": [],
}


def _handle_mqtt_message(client, userdata, msg) -> None:
    try:
        data = json.loads(msg.payload.decode("utf-8"))
    except Exception:  # noqa: BLE001
        return

    print_info = data.get("print")
    if not print_info:
        return

    with _state_lock:
        if "gcode_state" in print_info:
            _current_state["gcode_state"] = print_info["gcode_state"]
        if "subtask_name" in print_info:
            _current_state["job_name"] = print_info["subtask_name"] or None
        if "mc_percent" in print_info:
            _current_state["progress"] = print_info["mc_percent"]

        ams_container = print_info.get("ams")
        if ams_container and "ams" in ams_container:
            ams_slots = []
            for ams_unit in ams_container["ams"]:
                unit_id = ams_unit.get("id", "0")
                for tray in ams_unit.get("tray", []):
                    material = tray.get("tray_type")
                    if not material:
                        continue  # prazdny slot, preskoc
                    tray_id = tray.get("id", "0")
                    try:
                        slot_number = int(unit_id) * 4 + int(tray_id) + 1
                    except (TypeError, ValueError):
                        slot_number = 0
                    remain = tray.get("remain")
                    ams_slots.append(
                        {
                            "slot": slot_number,
                            "materialType": material,
                            "colorHex": _hex_from_bambu_color(tray.get("tray_color", "")),
                            "remainingPercent": remain if isinstance(remain, int) else None,
                        }
                    )
            _current_state["ams_slots"] = ams_slots


PRINTING_STATES = ("RUNNING", "PREPARE", "SLICING")
STATUS_SEND_INTERVAL_SECONDS = 20


def _periodic_status_sender() -> None:
    """Bezi nepretrzite v samostatnom vlakne - kazdych STATUS_SEND_INTERVAL_SECONDS
    posle appke aktualne (poskladane) zname udaje, nezavisle na tom, kedy presne
    prisla posledna MQTT sprava."""
    while True:
        time.sleep(STATUS_SEND_INTERVAL_SECONDS)
        with _state_lock:
            gcode_state = _current_state["gcode_state"]
            if gcode_state is None:
                continue  # este sme nedostali ziadnu spravu s tymto udajom
            is_printing = gcode_state in PRINTING_STATES
            job_name = _current_state["job_name"]
            progress = _current_state["progress"]
            ams_slots = list(_current_state["ams_slots"])
        _post_printer_status(is_printing, job_name, progress, ams_slots)


def start_printer_status_reporter() -> None:
    """
    Bezi na pozadi (samostatne vlakno) - pripoji sa na tlaciaren cez MQTT
    (rovnaky pristupovy kod ako pri LAN Only Mode) a periodicky posiela
    appke jej zivy stav (tlaci/volna + zalozene materialy v AMS), aby to
    zakaznik videl este pred objednavkou. Ak chybaju potrebne premenne
    alebo kniznica paho-mqtt, tato cast sa jednoducho vynecha a zvysok
    skriptu (sledovanie objednavok) funguje normalne dalej.
    """
    if not (PRINTER_IP and PRINTER_ACCESS_CODE and PRINTER_SERIAL):
        print(
            "[tlaciaren] PRINTER_IP/PRINTER_ACCESS_CODE/PRINTER_SERIAL nie su "
            "nastavene - zivy stav tlaciarne sa nebude zobrazovat zakaznikom."
        )
        return
    if not MQTT_AVAILABLE:
        print("[tlaciaren] Chyba kniznica paho-mqtt - spusti `pip install paho-mqtt`.")
        return

    def run() -> None:
        try:
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
        except AttributeError:
            client = mqtt.Client()  # starsia verzia paho-mqtt (1.x)

        client.username_pw_set("bblp", PRINTER_ACCESS_CODE)
        client.tls_set(cert_reqs=ssl.CERT_NONE)
        client.tls_insecure_set(True)  # tlaciaren pouziva vlastny (self-signed) certifikat
        client.on_message = _handle_mqtt_message

        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                print("[tlaciaren] Pripojene na tlaciaren (MQTT), sledujem stav...")
                client.subscribe(f"device/{PRINTER_SERIAL}/report")
            else:
                print(f"[tlaciaren] Pripojenie na tlaciaren zlyhalo (kod {rc}) - over IP/kod/seriove cislo.")

        client.on_connect = on_connect

        while True:
            try:
                client.connect(PRINTER_IP, 8883, keepalive=30)
                client.loop_forever()
            except Exception as exc:  # noqa: BLE001
                print(f"[tlaciaren] Chyba pripojenia na tlaciaren: {exc} - skusam znova o 15s")
                time.sleep(15)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    sender_thread = threading.Thread(target=_periodic_status_sender, daemon=True)
    sender_thread.start()


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
    start_printer_status_reporter()

    while True:
        try:
            process_order_queue()
        except Exception as exc:  # noqa: BLE001
            print(f"! Chyba v hlavnej slucke: {exc}")
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
