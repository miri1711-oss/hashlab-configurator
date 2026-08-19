import { createHmac, timingSafeEqual } from "crypto";

export interface SessionPayload {
  role: "customer" | "admin";
  email?: string;
  exp: number; // unix timestamp (sekundy)
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Chyba SESSION_SECRET v prostredi - nastav ho vo Verceli (nahodny dlhy retazec)."
    );
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

/**
 * Vytvori podpisany token v tvare "<base64 payload>.<podpis>" - da sa
 * bezpecne ulozit do cookie na strane klienta, lebo bez znalosti
 * SESSION_SECRET sa neda sfalsovat ani precitat nic citlive (obsahuje len
 * email a rolu, nie heslo).
 */
export function createSessionToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expirovane
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "hashlab_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dni
