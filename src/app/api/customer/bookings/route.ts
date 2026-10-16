import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para consultar seus agendamentos." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  try {
    const [bookings, completedCount] = await Promise.all([
      prisma.booking.findMany({
        where: { userId: user.id },
        orderBy: { startAt: "desc" },
        select: { id: true, service: true, location: true, startAt: true, endAt: true, status: true, servicePrice: true, mobilityFee: true, totalPrice: true, address: true },
      }),
      prisma.booking.count({ where: { userId: user.id, status: "COMPLETED" } }),
    ]);
    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        ...booking,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
        serviceLabel: ({ HAND: "Mão", FOOT: "Pé", BOTH: "Pé + mão" } as const)[booking.service],
        locationLabel: booking.location === "HOME" ? "Em domicílio" : "No salão",
        totalPriceLabel: (booking.totalPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      })),
      loyalty: { completedCount, visitsUntilReward: completedCount % 10 === 0 && completedCount > 0 ? 0 : 10 - (completedCount % 10), rewardsEarned: Math.floor(completedCount / 10) },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar seus agendamentos." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
