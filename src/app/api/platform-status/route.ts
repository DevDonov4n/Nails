import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const loyalty = await prisma.platformFeature.findUnique({
      where: { key: "loyalty" },
      select: { enabled: true, updatedAt: true },
    });
    return NextResponse.json({
      loyalty: {
        enabled: loyalty?.enabled ?? true,
        updatedAt: loyalty?.updatedAt.toISOString() ?? null,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar os avisos da plataforma." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
