export interface OrderConfirmationData {
  id: string;
  email: string;
  fullName: string;
  materialName: string;
  colorLabel: string;
  infillLabel: string;
  layerHeightLabel: string;
  quantity: number;
  totalPrice: number;
  shippingMethod: string;
  isResin?: boolean;
}

const SHIPPING_LABELS: Record<string, string> = {
  courier: "Kuriér",
  packeta: "Výdajné miesto (Packeta)",
  pickup: "Osobný odber",
};

function buildHtmlEmail(order: OrderConfirmationData, shippingLabel: string): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e9f2fa;color:#5b6b85;font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e9f2fa;color:#0f1b2d;font-size:14px;font-weight:600;text-align:right;">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Potvrdenie objednávky</title>
</head>
<body style="margin:0;padding:0;">
  <div style="background:#f4f8fc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dfeaf7;">
      <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:28px 28px 22px;">
        <div style="display:inline-block;background:#ffffff;border-radius:10px;padding:6px;margin-bottom:10px;">
          <img
            src="https://hashlab-configurator.vercel.app/logo.png"
            alt="Hashlab.sk"
            width="28"
            height="28"
            style="display:block;"
          />
        </div>
        <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Hashlab.sk</p>
        <p style="margin:6px 0 0;color:#dbeafe;font-size:14px;">Ďakujeme za objednávku!</p>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 4px;color:#0f1b2d;font-size:15px;">Dobrý deň, ${order.fullName || ""}</p>
        <p style="margin:0 0 20px;color:#5b6b85;font-size:14px;">
          objednávka <strong style="color:#0f1b2d;">${order.id}</strong> bola úspešne prijatá. Tu je jej súhrn:
        </p>
        <table width="100%" style="width:100%;border-collapse:collapse;">
          ${row("Materiál", order.materialName)}
          ${row("Farba", order.colorLabel)}
          ${row("Výplň", order.infillLabel)}
          ${row("Výška vrstvy", order.layerHeightLabel)}
          ${row("Počet kusov", String(order.quantity))}
          ${row("Doprava", shippingLabel)}
          <tr>
            <td style="padding-top:16px;color:#5b6b85;font-size:14px;">Celková cena</td>
            <td style="padding-top:16px;color:#2563eb;font-size:24px;font-weight:700;text-align:right;">${order.totalPrice.toFixed(2)} €</td>
          </tr>
        </table>
        ${order.isResin ? `<p style="margin:16px 0 0;padding:12px;background:#faf5ff;border-radius:10px;color:#6b21a8;font-size:13px;line-height:1.5;">
          ⏱️ Živicové modely potrebujú po vytlačení umytie a UV vytvrdenie - počítaj s cca 1-2 dňami navyše.
        </p>` : ""}
        <p style="margin:24px 0 0;color:#5b6b85;font-size:13px;line-height:1.5;">
          Ozveme sa vám, akonáhle bude objednávka pripravená na odoslanie/vyzdvihnutie.
        </p>
      </div>
      <div style="padding:16px 28px;background:#f4f8fc;border-top:1px solid #dfeaf7;">
        <p style="margin:0;color:#8b97ad;font-size:12px;">Hashlab.sk · 3D tlač na mieru</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Posle zakaznikovi potvrdenie objednavky emailom cez Resend. Zlyhanie
 * odoslania sa len zaloguje - nema zablokovat samotne vytvorenie/potvrdenie
 * objednavky, ktore je dolezitejsie ako samotny email.
 */
export async function sendOrderConfirmationEmail(order: OrderConfirmationData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Chyba RESEND_API_KEY - potvrdenie objednávky sa neposlalo emailom.");
    return;
  }
  if (!order.email) return;

  const shippingLabel = SHIPPING_LABELS[order.shippingMethod] ?? order.shippingMethod;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "hashlab.sk <onboarding@resend.dev>",
        to: [order.email],
        subject: `Potvrdenie objednávky ${order.id} - Hashlab.sk`,
        html: buildHtmlEmail(order, shippingLabel),
        text: [
          `Dobrý deň, ${order.fullName || ""}`,
          "",
          `ďakujeme za objednávku č. ${order.id}. Tu je jej súhrn:`,
          "",
          `Materiál: ${order.materialName}`,
          `Farba: ${order.colorLabel}`,
          `Výplň: ${order.infillLabel}`,
          `Výška vrstvy: ${order.layerHeightLabel}`,
          `Počet kusov: ${order.quantity}`,
          `Doprava: ${shippingLabel}`,
          `Celková cena: ${order.totalPrice.toFixed(2)} €`,
          "",
          ...(order.isResin
            ? ["", "Živicové modely potrebujú po vytlačení umytie a UV vytvrdenie - počítaj s cca 1-2 dňami navyše."]
            : []),
          "",
          "Ozveme sa vám, akonáhle bude objednávka pripravená na odoslanie/vyzdvihnutie.",
          "",
          "Hashlab.sk",
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      console.error("Resend chyba pri odosielaní potvrdenia objednávky:", await response.text());
    }
  } catch (error) {
    console.error("Nepodarilo sa odoslať potvrdenie objednávky emailom:", error);
  }
}

/**
 * Posle KRATKE interne upozornenie na novu objednavku - pre obsluhu/sefa,
 * nie pre zakaznika. Pouziva rovnaky Resend ucet, len ina prijemca adresa
 * (nastavena cez INTERNAL_NOTIFICATION_EMAIL premennu).
 */
export async function sendInternalOrderNotification(order: OrderConfirmationData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.INTERNAL_NOTIFICATION_EMAIL;
  if (!apiKey || !notifyEmail) {
    console.error("Chyba RESEND_API_KEY alebo INTERNAL_NOTIFICATION_EMAIL - interne upozornenie sa neposlalo.");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "hashlab.sk <onboarding@resend.dev>",
        to: [notifyEmail],
        subject: `🔔 Nová objednávka ${order.id} (${order.totalPrice.toFixed(2)} €)`,
        text: [
          `Nová objednávka: ${order.id}`,
          `Zákazník: ${order.fullName} (${order.email})`,
          `Materiál: ${order.materialName} · ${order.colorLabel}`,
          `Počet kusov: ${order.quantity}`,
          `Cena: ${order.totalPrice.toFixed(2)} €`,
          `Doprava: ${order.shippingMethod}`,
          "",
          "Pozri v admin paneli: https://hashlab-configurator.vercel.app/admin",
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      console.error("Resend chyba pri odosielani interneho upozornenia:", await response.text());
    }
  } catch (error) {
    console.error("Nepodarilo sa odoslat interne upozornenie:", error);
  }
}
