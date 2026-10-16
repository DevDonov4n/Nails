import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, hashPassword, sessionCookieOptions, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Envie os dados do cadastro em formato válido." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
  const digits = whatsapp.replace(/\D/g, "");
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Informe um nome entre 2 e 120 caracteres." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  if (digits.length < 10 || digits.length > 15) return NextResponse.json({ error: "Informe um WhatsApp válido com DDD." }, { status: 400 });
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "A senha deve ter entre 8 e 128 caracteres." }, { status: 400 });

  try {
    // Validate session configuration before creating the account to avoid a half-completed registration.
    createSessionToken("configuration-check");
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Já existe uma conta com esse e-mail. Entre ou use outro endereço." }, { status: 409 });

    const user = await prisma.user.create({
      data: { name, email, whatsapp, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true },
    });
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(user.id), sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível criar a conta. Verifique a configuração do banco e tente novamente." }, { status: 500 });
  }
}
