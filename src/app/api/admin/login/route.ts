import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

const COOKIE = "nbs_admin_session";
const TTL = 60 * 60 * 8;

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!email || !password || password.length > 128) {
    return NextResponse.json({ error: "Informe e-mail e senha válidos." }, { status: 400 });
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    const payload = Buffer.from(JSON.stringify({
      sub: admin.id,
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + TTL,
    })).toString("base64url");
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE, payload + "." + sign(payload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TTL,
    });
    return response;
  } catch (error) {
    console.error("Falha no login administrativo:", error);
    return NextResponse.json({ error: "Não foi possível verificar o acesso administrativo." }, { status: 503 });
  }
}
