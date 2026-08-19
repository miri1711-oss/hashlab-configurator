import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = String(body.password ?? "");

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("Chyba ADMIN_PASSWORD v prostredi.");
    return NextResponse.json({ ok: false, error: "Admin prihlásenie nie je nastavené." }, { status: 500 });
  }

  if (!password || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ ok: false, error: "Nesprávne heslo." }, { status: 401 });
  }

  const sessionToken = createSessionToken({
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
