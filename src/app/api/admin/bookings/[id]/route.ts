import { BookingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/security/sessions";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdminSession())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { id } = await context.params;
  let body: { status?: unknown; paymentMethod?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Envie um status válido." }, { status: 400 });
  }

  const nextStatus = body.status;
  if (nextStatus !== "CONFIRMED" && nextStatus !== "CANCELLED" && nextStatus !== "COMPLETED") {
    return NextResponse.json({ error: "Status permitido: CONFIRMED, CANCELLED ou COMPLETED." }, { status: 400 });
  }

  const allowedPaymentMethods = ["PIX", "CASH", "CARD", "OTHER"] as const;
  if (nextStatus === "COMPLETED" && !allowedPaymentMethods.includes(body.paymentMethod as typeof allowedPaymentMethods[number])) {
    return NextResponse.json({ error: "Informe uma forma de pagamento válida para concluir o atendimento." }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id } });
      if (!booking) return { error: "Agendamento não encontrado.", status: 404 as const };
      if (nextStatus === "COMPLETED" && booking.status !== "CONFIRMED") return { error: "Somente atendimentos confirmados podem ser concluídos.", status: 409 as const };
      if ((nextStatus === "CONFIRMED" || nextStatus === "CANCELLED") && booking.status !== "PENDING") return { error: "Somente agendamentos pendentes podem ser confirmados ou recusados.", status: 409 as const };

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
        data: { status: nextStatus as BookingStatus, ...(nextStatus === "COMPLETED" ? { paymentMethod: body.paymentMethod as string } : {}) },
        select: { id: true, status: true, paymentMethod: true, userId: true },
      });
      if (nextStatus === "COMPLETED" && result.userId) {
        const completedBefore = await tx.booking.count({ where: { userId: result.userId, status: "COMPLETED", id: { not: id } } });
        const loyaltyFeature = await tx.platformFeature.findUnique({ where: { key: "loyalty" }, select: { enabled: true } });
        if ((loyaltyFeature?.enabled ?? true) && (completedBefore + 1) % 5 === 0) {
          await tx.user.update({ where: { id: result.userId }, data: { loyaltyRewardsAvailable: { increment: 1 } } });
        }
      }
      if (nextStatus === "CANCELLED" && booking.loyaltyDiscount > 0 && booking.userId) {
        await tx.user.update({ where: { id: booking.userId }, data: { loyaltyRewardsAvailable: { increment: 1 } } });
      }
      return { booking: result };
    });

    if ("error" in updated) return NextResponse.json({ error: updated.error }, { status: updated.status });
    return NextResponse.json({ booking: updated.booking }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao atualizar status do agendamento:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o agendamento." }, { status: 503 });
  }
}
