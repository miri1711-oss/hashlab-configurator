import { NextRequest, NextResponse } from "next/server";

// Kam sa maju posielat spravy z kontaktneho formulara.
const CONTACT_RECIPIENT = "mirkap1711@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Vyplňte prosím všetky polia." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Chyba RESEND_API_KEY v prostredi - email sa neposlal.");
      return NextResponse.json(
        { ok: false, error: "Formulár momentálne nie je dostupný, skúste to prosím neskôr." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Kym nie je overena vlastna domena v Resend, treba posielat z ich
        // testovacej adresy - pozri README pre navod na overenie domeny.
        from: "hashlab.sk kontakt <onboarding@resend.dev>",
        to: [CONTACT_RECIPIENT],
        reply_to: email,
        subject: `Nová správa z kontaktného formulára od ${name}`,
        text: `Meno: ${name}\nEmail: ${email}\n\nSpráva:\n${message}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend chyba pri odosielaní emailu:", errorText);
      return NextResponse.json(
        { ok: false, error: "Nepodarilo sa odoslať správu, skúste to prosím neskôr." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa spracovať kontaktný formulár:", error);
    return NextResponse.json({ ok: false, error: "Nastala chyba." }, { status: 500 });
  }
}
