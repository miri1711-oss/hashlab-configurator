import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createMagicLink, countRecentMagicLinks } from "@/lib/db";

const LINK_VALID_MINUTES = 15;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Zadajte platný email." }, { status: 400 });
    }

    const recentCount = await countRecentMagicLinks(email, RATE_LIMIT_WINDOW_MINUTES);
    if (recentCount >= RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        {
          ok: false,
          error: `Príliš veľa žiadostí o prihlásenie. Skúste to prosím znova o ${RATE_LIMIT_WINDOW_MINUTES} minút.`,
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Chyba RESEND_API_KEY - prihlasovací odkaz sa neposlal.");
      return NextResponse.json(
        { ok: false, error: "Prihlásenie momentálne nie je dostupné, skúste to prosím neskôr." },
        { status: 500 }
      );
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + LINK_VALID_MINUTES * 60 * 1000);
    await createMagicLink(token, email, expiresAt);

    const origin = request.nextUrl.origin;
    const verifyUrl = `${origin}/api/auth/verify?token=${token}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Hashlab.sk <onboarding@resend.dev>",
        to: [email],
        subject: "Prihlásenie na Hashlab.sk",
        html: `<!DOCTYPE html>
<html lang="sk"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;">
  <div style="background:#f4f8fc;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:420px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #dfeaf7;">
      <p style="margin:0 0 16px;color:#0f1b2d;font-size:16px;">Kliknutím na tlačidlo sa prihlásite na Hashlab.sk:</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">Prihlásiť sa</a>
      <p style="margin:20px 0 0;color:#5b6b85;font-size:13px;">Odkaz je platný ${LINK_VALID_MINUTES} minút. Ak ste o prihlásenie nežiadali, tento email môžete ignorovať.</p>
    </div>
  </div>
</body></html>`,
        text: `Kliknutím na odkaz sa prihlásite na Hashlab.sk: ${verifyUrl}\n\nOdkaz je platný ${LINK_VALID_MINUTES} minút. Ak ste o prihlásenie nežiadali, tento email môžete ignorovať.`,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Resend chyba pri odosielaní prihlasovacieho odkazu:", await emailResponse.text());
      return NextResponse.json(
        { ok: false, error: "Nepodarilo sa odoslať prihlasovací email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Chyba pri žiadosti o prihlásenie:", error);
    return NextResponse.json({ ok: false, error: "Nastala chyba." }, { status: 500 });
  }
}
