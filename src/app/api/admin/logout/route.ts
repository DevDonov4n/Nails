import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, revokeCurrentSession } from "@/lib/security/sessions";

export async function POST() {
  try {
    await revokeCurrentSession(ADMIN_SESSION_COOKIE);
  } catch {
    return NextResponse.json({ error: "Não foi possível encerrar a sessão." }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
