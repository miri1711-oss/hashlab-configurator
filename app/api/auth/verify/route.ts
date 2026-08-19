import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const origin = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/prihlasenie?error=chybajuci_token`);
  }

  const email = await consumeMagicLink(token);
  if (!email) {
    return NextResponse.redirect(`${origin}/prihlasenie?error=neplatny_alebo_expirovany`);
  }

  const sessionToken = createSessionToken({
    role: "customer",
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  });

  const response = NextResponse.redirect(`${origin}/moje-objednavky`);
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
