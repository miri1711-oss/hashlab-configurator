import { NextRequest, NextResponse } from "next/server";

/**
 * Prijme upozornenie od print_bridge.py skriptu (ked MQTT pripojenie
 * opakovane zlyha - mozno vyprsal Cloud token alebo sa zmenil pristupovy
 * kod) a posle email na INTERNAL_NOTIFICATION_EMAIL.
 */
export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.ORDERS_VIEW_KEY || key !== process.env.ORDERS_VIEW_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.INTERNAL_NOTIFICATION_EMAIL;
  if (!apiKey || !notifyEmail) {
    return NextResponse.json({ ok: false, error: "email not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const reason = String(body.reason ?? "Neznámy dôvod");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "hashlab.sk <onboarding@resend.dev>",
        to: [notifyEmail],
        subject: "⚠️ Tlačiareň - problém s pripojením",
        text: [
          "Print bridge skript hlási opakované zlyhanie pripojenia na tlačiareň.",
          "",
          `Dôvod: ${reason}`,
          "",
          "Ak používaš Cloud pripojenie, možno je potrebné získať nový token.",
          "Ak si v kancelárii na LAN, over pristupový kód na tlačiarni.",
        ].join("\n"),
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Nepodarilo sa odoslat upozornenie o tlaciarni:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
