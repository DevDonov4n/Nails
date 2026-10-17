import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "nbs_admin_session";
const TTL = 60 * 60 * 8;

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return NextResponse.json({ error: "O acesso administrativo ainda não foi configurado no ambiente." }, { status: 503 });
  const expected = Buffer.from(adminPassword);
  const received = Buffer.from(password);
  const passwordOk = expected.length === received.length && timingSafeEqual(expected, received);
  if (email !== adminEmail || !passwordOk) return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  try {
    const payload = Buffer.from(JSON.stringify({ role: "admin", exp: Math.floor(Date.now() / 1000) + TTL })).toString("base64url");
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, payload + "." + sign(payload), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: TTL });
    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível iniciar a sessão administrativa." }, { status: 500 });
  }
}
