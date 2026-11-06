import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import {
  createAdminSession,
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from "@/lib/security/sessions";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
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

    const token = await createAdminSession(admin.id);
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Falha no login administrativo:", error);
    return NextResponse.json({ error: "Não foi possível verificar o acesso administrativo." }, { status: 503 });
  }
}
