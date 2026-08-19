"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CustomerDetails,
  PAYMENT_OPTIONS,
  PaymentMethod,
  SHIPPING_OPTIONS,
  ShippingMethod,
  generateOrderNumber,
} from "@/lib/order";
import { formatEuro } from "@/lib/pricing";

export interface OrderSummaryData {
  fileName: string;
  materialName: string;
  colorLabel: string;
  hasCustomPaint?: boolean;
  infillLabel: string;
  layerHeightLabel: string;
  quantity: number;
  itemsPrice: number;
  deliveryLabel: string;
}

interface CheckoutFlowProps {
  file: File | null;
  paintPreviewDataUrl?: string | null;
  summary: OrderSummaryData;
  onBack: () => void;
  onStartOver: () => void;
}

const EMPTY_DETAILS: CustomerDetails = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  zip: "",
};

export default function CheckoutFlow({
  file,
  paintPreviewDataUrl,
  summary,
  onBack,
  onStartOver,
}: CheckoutFlowProps) {
  const [details, setDetails] = useState<CustomerDetails>(EMPTY_DETAILS);
  const [shipping, setShipping] = useState<ShippingMethod>("courier");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [packetaPointName, setPacketaPointName] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, boolean>>>({});
  const [packetaError, setPacketaError] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const packetaApiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY;

  // Nacitanie oficialnej Packeta kniznice na vyber vydajneho miesta (widget
  // v6) - kym nie je nastaveny API kluc (zdarma, registracia na
  // client.packeta.com), zostava zakaznikom k dispozicii len textove pole.
  useEffect(() => {
    if (!packetaApiKey) return;
    if (document.getElementById("packeta-widget-lib")) return;
    const script = document.createElement("script");
    script.id = "packeta-widget-lib";
    script.src = "https://widget.packeta.com/v6/www/js/library.js";
    script.async = true;
    document.head.appendChild(script);
  }, [packetaApiKey]);

  function openPacketaWidget() {
    const packetaWindow = window as unknown as {
      Packeta?: { Widget: { pick: (apiKey: string, callback: (point: unknown) => void, options?: object) => void } };
    };
    if (!packetaApiKey || !packetaWindow.Packeta) return;
    packetaWindow.Packeta.Widget.pick(
      packetaApiKey,
      (point: unknown) => {
        const selected = point as { name?: string } | null;
        if (selected?.name) {
          setPacketaPointName(selected.name);
          setPacketaError(false);
        }
      },
      { country: "sk,cz" }
    );
  }

  const shippingOption = SHIPPING_OPTIONS.find((o) => o.id === shipping)!;
  const totalWithShipping = summary.itemsPrice + shippingOption.price;

  function updateField<K extends keyof CustomerDetails>(field: K, value: string) {
    setDetails((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const requiredFields: (keyof CustomerDetails)[] = ["fullName", "email", "phone", "street", "city", "zip"];
    const nextErrors: Partial<Record<keyof CustomerDetails, boolean>> = {};
    let valid = true;

    for (const field of requiredFields) {
      if (!details[field].trim()) {
        nextErrors[field] = true;
        valid = false;
      }
    }
    if (details.email && !/^\S+@\S+\.\S+$/.test(details.email)) {
      nextErrors.email = true;
      valid = false;
    }

    const needsPacketaPoint = shipping === "packeta" && !packetaPointName.trim();
    setPacketaError(needsPacketaPoint);
    if (needsPacketaPoint) valid = false;

    setErrors(nextErrors);
    return valid;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const newOrderNumber = generateOrderNumber();
    setIsSaving(true);
    setSaveFailed(false);

    // Najprv nahráme skutočný STL súbor do úložiska - bez toho by sa
    // objednávka uložila len s menom súboru, nie s dátami potrebnými na tlač.
    let modelFileUrl: string | null = null;
    if (file) {
      try {
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        const uploadResponse = await fetch("/api/upload-stl", {
          method: "POST",
          body: uploadForm,
        });
        const uploadData = await uploadResponse.json();
        if (uploadResponse.ok && uploadData.url) {
          modelFileUrl = uploadData.url;
        }
      } catch {
        // Nahratie súboru zlyhalo - objednávka sa napriek tomu uloží (aspoň
        // kontaktné údaje a konfiguráciu), ale bude ju treba doriešiť ručne.
      }
    }

    // Ak zákazník použil viacfarebné maľovanie, nahráme aj snímku toho, ako
    // má model vyzerať - STL/OBJ formát farby neuchováva, takže bez tohto
    // by obsluha pri tlačiarni nevedela, ktoré časti majú byť aké farby.
    let paintPreviewUrl: string | null = null;
    if (paintPreviewDataUrl) {
      try {
        const blob = await (await fetch(paintPreviewDataUrl)).blob();
        const previewForm = new FormData();
        previewForm.append("file", blob, `${newOrderNumber}-farby.png`);
        const previewUploadResponse = await fetch("/api/upload-stl", {
          method: "POST",
          body: previewForm,
        });
        const previewUploadData = await previewUploadResponse.json();
        if (previewUploadResponse.ok && previewUploadData.url) {
          paintPreviewUrl = previewUploadData.url;
        }
      } catch {
        // Nepodarilo sa nahrať snímku farieb - objednávka sa aj tak uloží,
        // len bez tejto vizuálnej pomôcky pre obsluhu.
      }
    }

    const orderPayload = {
      orderNumber: newOrderNumber,
      fullName: details.fullName,
      email: details.email,
      phone: details.phone,
      street: details.street,
      city: details.city,
      zip: details.zip,
      shippingMethod: shipping,
      packetaPointName: shipping === "packeta" ? packetaPointName : null,
      paymentMethod: payment,
      fileName: summary.fileName,
      modelFileUrl,
      paintPreviewUrl,
      materialName: summary.materialName,
      colorLabel: summary.colorLabel,
      hasCustomPaint: Boolean(summary.hasCustomPaint),
      infillLabel: summary.infillLabel,
      layerHeightLabel: summary.layerHeightLabel,
      quantity: summary.quantity,
      totalPrice: totalWithShipping,
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      if (!response.ok) setSaveFailed(true);

      if (payment === "card") {
        // Objednávka je uložená so stavom "pending_payment" - teraz
        // presmerujeme na Stripe, kde zákazník platbu skutočne dokončí.
        // Potvrdenie prijde späť cez webhook (lib/db.ts -> updateOrderStatus).
        const checkoutResponse = await fetch("/api/checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newOrderNumber,
            totalPrice: totalWithShipping,
            email: details.email,
          }),
        });
        const checkoutData = await checkoutResponse.json();
        if (checkoutResponse.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return; // opúšťame stránku, netreba už nič nastavovať
        }
        // Ak sa platbu nepodarilo vytvoriť (napr. Stripe ešte nie je
        // nastavený), aspoň zobrazíme lokálne potvrdenie, nech zákazník
        // nezostane visieť bez odpovede.
        setSaveFailed(true);
      }
    } catch {
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
      setOrderNumber(newOrderNumber);
    }
  }

  if (orderNumber) {
    return (
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl p-8 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))" }}
        >
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="var(--emerald)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="display text-xl font-bold text-[var(--text-1)]">Objednávka bola prijatá</h2>
        <p className="mono text-sm text-[var(--text-2)]">Číslo objednávky: {orderNumber}</p>
        <p className="text-sm text-[var(--text-3)]">
          Potvrdenie sme poslali na {details.email}. Odhadované doručenie: {summary.deliveryLabel}.
        </p>
        {saveFailed && (
          <p className="text-xs text-amber-600">
            Objednávka sa nepodarilo uložiť do databázy (skús to prosím nahlásiť podpore) - údaje vyššie máš
            aspoň zaznamenané tu.
          </p>
        )}

        <div className="mt-2 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-4 text-left text-sm">
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-3)]">Súbor</span>
            <span className="mono text-[var(--text-1)]">{summary.fileName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-3)]">Materiál</span>
            <span className="text-[var(--text-1)]">{summary.materialName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-3)]">Doprava</span>
            <span className="text-[var(--text-1)]">{shippingOption.label}</span>
          </div>
          {shipping === "packeta" && packetaPointName && (
            <div className="flex justify-between py-1">
              <span className="text-[var(--text-3)]">Výdajné miesto</span>
              <span className="text-[var(--text-1)]">{packetaPointName}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-[var(--border-soft)] pt-2 font-bold">
            <span className="text-[var(--text-1)]">Celkom</span>
            <span className="grad-text mono">{formatEuro(totalWithShipping)}</span>
          </div>
        </div>

        <button
          onClick={onStartOver}
          className="btn-gradient mt-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
        >
          Vytvoriť novú objednávku
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-5">
      <section className="flex flex-col gap-4 lg:col-span-3">
        <div className="card rounded-2xl p-4 sm:p-5">
          <p className="display mb-3.5 text-sm font-bold text-[var(--text-1)]">Kontaktné a doručovacie údaje</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Meno a priezvisko"
              value={details.fullName}
              error={errors.fullName}
              onChange={(v) => updateField("fullName", v)}
              placeholder="Ján Novák"
              full
            />
            <Field
              label="Email"
              type="email"
              value={details.email}
              error={errors.email}
              onChange={(v) => updateField("email", v)}
              placeholder="jan@priklad.sk"
            />
            <Field
              label="Telefón"
              type="tel"
              value={details.phone}
              error={errors.phone}
              onChange={(v) => updateField("phone", v)}
              placeholder="+421 900 123 456"
            />
            <Field
              label="Ulica a číslo"
              value={details.street}
              error={errors.street}
              onChange={(v) => updateField("street", v)}
              placeholder="Hlavná 12"
              full
            />
            <Field
              label="Mesto"
              value={details.city}
              error={errors.city}
              onChange={(v) => updateField("city", v)}
              placeholder="Bratislava"
            />
            <Field
              label="PSČ"
              value={details.zip}
              error={errors.zip}
              onChange={(v) => updateField("zip", v)}
              placeholder="811 01"
            />
          </div>
        </div>

        <div className="card rounded-2xl p-4 sm:p-5">
          <p className="display mb-3.5 text-sm font-bold text-[var(--text-1)]">Spôsob dopravy</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SHIPPING_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setShipping(option.id)}
                className={`option-card ${option.id === shipping ? "selected" : ""}`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text-1)]">{option.label}</span>
                  <span className="mono text-xs text-[var(--text-2)]">
                    {option.price === 0 ? "zdarma" : formatEuro(option.price)}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-3)]">{option.description}</span>
              </button>
            ))}
          </div>

          {shipping === "packeta" && (
            <div className="mt-3">
              {packetaApiKey ? (
                <div>
                  <button
                    type="button"
                    onClick={openPacketaWidget}
                    className={`option-card w-full text-left ${packetaError ? "field-error" : ""}`}
                  >
                    <span className="text-sm font-semibold text-[var(--text-1)]">
                      {packetaPointName || "Vybrať výdajné miesto"}
                    </span>
                    {!packetaPointName && (
                      <span className="mt-0.5 block text-xs text-[var(--text-3)]">
                        Klikni pre otvorenie mapy výdajných miest
                      </span>
                    )}
                  </button>
                  {packetaError && (
                    <p className="mt-1 text-xs text-red-600">Vyberte prosím výdajné miesto.</p>
                  )}
                </div>
              ) : (
                <>
                  <Field
                    label="Výdajné miesto"
                    value={packetaPointName}
                    error={packetaError}
                    onChange={setPacketaPointName}
                    placeholder="Napr. Packeta Box, Hlavná 1, Spišská Nová Ves"
                    full
                  />
                  <p className="mt-1 text-xs text-[var(--text-3)]">
                    Dočasné riešenie - skutočný výber výdajného miesta cez Packeta mapu doplníme, keď bude k
                    dispozícii API prístup.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card rounded-2xl p-4 sm:p-5">
          <p className="display mb-3.5 text-sm font-bold text-[var(--text-1)]">Spôsob platby</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setPayment(option.id)}
                className={`option-card ${option.id === payment ? "selected" : ""}`}
              >
                <span className="block text-sm font-semibold text-[var(--text-1)]">{option.label}</span>
                <span className="mt-0.5 block text-xs text-[var(--text-3)]">{option.description}</span>
              </button>
            ))}
          </div>
          {payment === "card" && (
            <p className="mt-2 text-xs text-[var(--text-3)]">
              Po kliknutí na "Záväzne objednať" budeš presmerovaný/á na bezpečnú platobnú stránku Stripe.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-fit text-xs font-semibold text-[var(--text-3)] hover:text-[var(--text-1)]"
        >
          ← Späť na konfiguráciu
        </button>
      </section>

      <section className="flex flex-col gap-4 lg:col-span-2">
        <div className="card sticky top-4 rounded-2xl p-4 sm:p-5">
          <p className="display mb-3.5 text-sm font-bold text-[var(--text-1)]">Súhrn objednávky</p>
          <div className="flex flex-col gap-2 text-sm">
            <SummaryRow label="Súbor" value={summary.fileName} mono />
            <SummaryRow label="Materiál" value={summary.materialName} />
            <SummaryRow label="Farba" value={summary.colorLabel} />
            {summary.hasCustomPaint && (
              <SummaryRow label="Viac farieb" value="Áno (namaľované na modeli)" />
            )}
            <SummaryRow label="Výplň" value={summary.infillLabel} />
            <SummaryRow label="Výška vrstvy" value={summary.layerHeightLabel} />
            <SummaryRow label="Počet kusov" value={String(summary.quantity)} />
            <SummaryRow label="Doprava" value={shippingOption.label} />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-soft)] pt-4">
            <span className="text-sm font-semibold text-[var(--text-1)]">Celkom s DPH</span>
            <span className="grad-text mono text-xl font-bold">{formatEuro(totalWithShipping)}</span>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-gradient mt-4 w-full rounded-xl px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isSaving ? "Odosielam..." : "Záväzne objednať"}
          </button>
        </div>
      </section>
    </form>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
  full?: boolean;
}

function Field({ label, value, onChange, placeholder, type = "text", error, full }: FieldProps) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-[var(--text-2)]">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`field-input ${error ? "field-error" : ""}`}
      />
    </label>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-3)]">{label}</span>
      <span className={`truncate text-right text-[var(--text-1)] ${mono ? "mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
