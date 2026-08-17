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
}

const SHIPPING_LABELS: Record<string, string> = {
  courier: "Kuriér",
  packeta: "Výdajné miesto (Packeta)",
  pickup: "Osobný odber",
};

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
        subject: `Potvrdenie objednávky ${order.id} - hashlab.sk`,
        text: [
          `Ahoj ${order.fullName || ""},`,
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
          "Ozveme sa vám, akonáhle bude objednávka pripravená na odoslanie/vyzdvihnutie.",
          "",
          "hashlab.sk",
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
