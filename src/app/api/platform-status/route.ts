import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const [loyalty, discountFeature, campaign] = await Promise.all([
      prisma.platformFeature.findUnique({
        where: { key: "loyalty" },
        select: { enabled: true, updatedAt: true },
      }),
      prisma.platformFeature.findUnique({
        where: { key: "promotional-discounts" },
        select: { enabled: true },
      }),
      prisma.platformEvent.findFirst({
        where: { type: "LAUNCH_DISCOUNT", active: true, endsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        select: { title: true, discountPercent: true, startsAt: true, endsAt: true },
      }),
    ]);
    return NextResponse.json({
      loyalty: {
        enabled: loyalty?.enabled ?? true,
        updatedAt: loyalty?.updatedAt.toISOString() ?? null,
      },
      campaign: (discountFeature?.enabled ?? true) && campaign ? {
        title: campaign.title,
        discountPercent: campaign.discountPercent,
        startsAt: campaign.startsAt.toISOString(),
        endsAt: campaign.endsAt.toISOString(),
        active: campaign.startsAt <= now && campaign.endsAt >= now,
      } : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar os avisos da plataforma." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
