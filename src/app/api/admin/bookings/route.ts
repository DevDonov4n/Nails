import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE = "nbs_admin_session";
async function adminSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  const secret = process.env.SESSION_SECRET;
  if (!payload || !signature || !secret || secret.length < 32) return false;
  try {
    const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: unknown; role?: unknown; exp?: unknown };
    return data.role === "admin" && typeof data.sub === "string" && typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

export async function GET() {
  if (!(await adminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const bookings = await prisma.booking.findMany({
      select: { id: true, customerName: true, whatsapp: true, address: true, service: true, location: true, startAt: true, endAt: true, status: true, servicePrice: true, mobilityFee: true, totalPrice: true, userId: true },
      orderBy: { startAt: "desc" },
    });
    return NextResponse.json({ bookings: bookings.map((booking) => ({ ...booking, startAt: booking.startAt.toISOString(), endAt: booking.endAt.toISOString() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao carregar agendamentos administrativos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os agendamentos." }, { status: 503 });
  }
}