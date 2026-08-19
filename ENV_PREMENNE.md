# ENV premenné potrebné pre hashlab-configurator

Nastavuje sa vo Verceli: Settings → Environment Variables
(pre každú zvoľ Production + Preview, pokiaľ nie je uvedené inak)

## 1. Databáza objednávok (Neon Postgres)
Automaticky sa vytvorí pri prepojení Neon databázy vo Verceli
(Storage → Create Database → Postgres), premenné sa doplnia SAMÉ:
- POSTGRES_URL
- (a súvisiace POSTGRES_* premenné - netreba zadávať ručne)

## 2. Ukladanie STL/OBJ súborov (Vercel Blob)
Automaticky sa vytvorí pri prepojení Blob storage vo Verceli
(Storage → Create Database → Blob), DÔLEŽITÉ: zaškrtni
"Add a read-write token env var to this connection":
- BLOB_READ_WRITE_TOKEN

## 3. Platba kartou (Stripe)
Získať v dashboard.stripe.com → Developers → API keys / Webhooks:
- STRIPE_SECRET_KEY           (sk_test_... alebo sk_live_...)
- STRIPE_WEBHOOK_SECRET       (whsec_..., z Webhooks → Add endpoint
                                → https://<domena>/api/stripe-webhook,
                                event: checkout.session.completed)

## 4. Zobrazenie objednávok / tlačová fronta (vlastné heslo)
Vymyslené heslo, používa sa aj v scripts/print_bridge.py:
- ORDERS_VIEW_KEY              (napr. "hashlab2026tajne" - zmeniť podľa potreby)

## 5. Emaily (Resend)
Získať zadarmo na resend.com → API Keys:
- RESEND_API_KEY               (re_...)
  (posiela: potvrdenie objednávky zákazníkovi + správy z /kontakt formulára)

## 6. Packeta - výber výdajného miesta (voliteľné, zatiaľ nepovinné)
Zadarmo, registrácia na client.packeta.com:
- NEXT_PUBLIC_PACKETA_API_KEY
  POZOR: musí mať presne predponu "NEXT_PUBLIC_", inak appka v prehliadači
  premennú nevidí. Kým nie je nastavená, appka automaticky použije
  textové pole namiesto mapy (nič sa nepokazí).

## 7. Prihlasovanie (zákazníci + admin) - NOVÉ
Vlastné hodnoty, žiadna externá registrácia netreba:
- SESSION_SECRET     (dlhý náhodný reťazec, napr. vygenerovaný cez
                       `openssl rand -base64 32` - podpisuje prihlasovacie
                       cookies, nikdy ho nikomu neposielaj)
- ADMIN_PASSWORD     (heslo pre /admin - vlastné, zmeniteľné kedykoľvek)

---

## Zhrnutie - čo treba ručne zadať (nie je automatické)
1. STRIPE_SECRET_KEY
2. STRIPE_WEBHOOK_SECRET
3. ORDERS_VIEW_KEY
4. RESEND_API_KEY
5. NEXT_PUBLIC_PACKETA_API_KEY (voliteľné)
6. SESSION_SECRET (NOVÉ - nutné pre prihlasovanie)
7. ADMIN_PASSWORD (NOVÉ - nutné pre /admin)

## Po nastavení premenných
Vždy spraviť Redeploy (Deployments → najnovší → ⋯ → Redeploy),
aby sa nové premenné prejavili na živej appke.

---

## Pripomienka - lokálny skript pri tlačiarni (scripts/print_bridge.py)
Tento skript beží mimo Vercelu, priamo na počítači pri tlačiarni.
Používa vlastné premenné (nastavujú sa cez `export` v termináli
alebo priamo v súbore):
- HASHLAB_ORDERS_KEY    (rovnaká hodnota ako ORDERS_VIEW_KEY vo Verceli)
- PRINTER_IP
- PRINTER_ACCESS_CODE
- PRINTER_SERIAL
- BAMBU_STUDIO_APP_NAME (voliteľné, predvolené "Bambu Studio")
