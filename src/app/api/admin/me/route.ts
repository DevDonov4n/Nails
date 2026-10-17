import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "nbs_admin_session";

export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const [payload, signature] = token.split(".");
  const secret = process.env.SESSION_SECRET;
  if (!payload || !signature || !secret || secret.length < 32) return NextResponse.json({ authenticated: false }, { status: 401 });
  try {
    const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("Invalid signature");
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: unknown; exp?: unknown };
    if (session.role !== "admin" || typeof session.exp !== "number" || session.exp <= Math.floor(Date.now() / 1000)) throw new Error("Invalid session");
    return NextResponse.json({ authenticated: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
}
