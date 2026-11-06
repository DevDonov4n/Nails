import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { revokeCurrentSession } from "@/lib/security/sessions";

export async function POST() {
  try {
    await revokeCurrentSession(AUTH_COOKIE_NAME);
  } catch {
    return NextResponse.json({ error: "Não foi possível encerrar a sessão." }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
