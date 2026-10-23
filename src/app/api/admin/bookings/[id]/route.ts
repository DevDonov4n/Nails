import { BookingStatus } from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { id } = await context.params;
  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Envie um status válido." }, { status: 400 });
  }

  const nextStatus = body.status;
  if (nextStatus !== "CONFIRMED" && nextStatus !== "CANCELLED") {
    return NextResponse.json({ error: "Status permitido: CONFIRMED ou CANCELLED." }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) return { error: "Agendamento não encontrado.", status: 404 as const };
      if (booking.status !== "PENDING") return { error: "Somente agendamentos pendentes podem ser aprovados ou recusados.", status: 409 as const };

      if (nextStatus === "CONFIRMED") {
        const conflict = await tx.booking.findFirst({
          where: {
            id: { not: id },
            status: { in: ["PENDING", "CONFIRMED"] },
            startAt: { lt: booking.endAt },
            endAt: { gt: booking.startAt },
          },
          select: { id: true },
        });
        if (conflict) return { error: "Não é possível confirmar: esse horário conflita com outro agendamento ativo.", status: 409 as const };
      }

      const result = await tx.booking.update({
        where: { id },
        data: { status: nextStatus as BookingStatus },
        select: { id: true, status: true },
      });
      return { booking: result };
    });

    if ("error" in updated) return NextResponse.json({ error: updated.error }, { status: updated.status });
    return NextResponse.json({ booking: updated.booking }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao atualizar status do agendamento:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o agendamento." }, { status: 503 });
  }
}
