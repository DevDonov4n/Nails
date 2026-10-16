import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createSessionToken, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Envie os dados de login em formato válido." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || password.length > 128) return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(user.id), sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível entrar. Tente novamente em instantes." }, { status: 500 });
  }
}
