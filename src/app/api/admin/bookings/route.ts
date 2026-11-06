import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/security/sessions";

export async function GET() {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const bookings = await prisma.booking.findMany({
      select: { id: true, customerName: true, whatsapp: true, address: true, service: true, location: true, startAt: true, endAt: true, status: true, servicePrice: true, mobilityFee: true, totalPrice: true, loyaltyDiscount: true, promotionalDiscount: true, userId: true, paymentMethod: true },
      orderBy: { startAt: "desc" },
    });
    return NextResponse.json({ bookings: bookings.map((booking) => ({ ...booking, startAt: booking.startAt.toISOString(), endAt: booking.endAt.toISOString() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao carregar agendamentos administrativos:", error);
    return NextResponse.json({ error: "Não foi possível carregar os agendamentos." }, { status: 503 });
  }
}