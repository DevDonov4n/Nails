import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para consultar seus agendamentos." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  try {
    const [bookings, completedCount, account] = await Promise.all([
      prisma.booking.findMany({
        where: { userId: user.id },
        orderBy: { startAt: "desc" },
        select: { id: true, service: true, location: true, startAt: true, endAt: true, status: true, servicePrice: true, mobilityFee: true, totalPrice: true, loyaltyDiscount: true, address: true, updatedAt: true },
      }),
      prisma.booking.count({ where: { userId: user.id, status: "COMPLETED" } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { loyaltyRewardsAvailable: true } }),
    ]);
    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        ...booking,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
        serviceLabel: ({ HAND: "Mão", FOOT: "Pé", BOTH: "Pé + mão" } as const)[booking.service],
        locationLabel: booking.location === "HOME" ? "Em domicílio" : "No salão",
        totalPriceLabel: (booking.totalPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        loyaltyDiscountLabel: (booking.loyaltyDiscount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        updatedAt: booking.updatedAt.toISOString(),
      })),
      loyalty: { completedCount, visitsUntilReward: account?.loyaltyRewardsAvailable ? 0 : 5 - (completedCount % 5), rewardsEarned: Math.floor(completedCount / 5), rewardsAvailable: account?.loyaltyRewardsAvailable ?? 0, progress: account?.loyaltyRewardsAvailable ? 5 : completedCount % 5 },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar seus agendamentos." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
