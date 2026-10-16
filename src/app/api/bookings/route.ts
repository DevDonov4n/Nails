import { BookingLocation, BookingService } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { calculatePrice, isWithinBusinessHours, parseLocalDateTime, APPOINTMENT_MINUTES } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const services = new Set<BookingService>(["HAND", "FOOT", "BOTH"]);
const locations = new Set<BookingLocation>(["SALON", "HOME"]);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Envie os dados do agendamento em um objeto válido." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
  const digits = whatsapp.replace(/\D/g, "");
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const service = body.service as BookingService;
  const location = body.location as BookingLocation;
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";

  if (name.length < 2 || name.length > 120 || digits.length < 10 || digits.length > 15) {
    return NextResponse.json({ error: "Informe seu nome (até 120 caracteres) e um WhatsApp válido com DDD." }, { status: 400 });
  }
  if (!services.has(service) || !locations.has(location)) {
    return NextResponse.json({ error: "Selecione um tratamento e o local do atendimento." }, { status: 400 });
  }
  if (location === "HOME" && (address.length < 8 || address.length > 300)) {
    return NextResponse.json({ error: "Informe o endereço completo para atendimento em domicílio (até 300 caracteres)." }, { status: 400 });
  }

  const startAt = parseLocalDateTime(date, time);
  if (!startAt || startAt <= new Date()) {
    return NextResponse.json({ error: "Escolha uma data real e um horário futuro válido." }, { status: 400 });
  }

  const endAt = new Date(startAt.getTime() + APPOINTMENT_MINUTES * 60_000);
  if (!isWithinBusinessHours(startAt, endAt)) {
    return NextResponse.json({ error: "Esse horário está fora do expediente. Seg–sex: 16h–20h; sáb–dom: 9h–18h." }, { status: 400 });
  }

  const price = calculatePrice(service, location);
  try {
    // Keep this as a single database transaction. If the configured LibSQL adapter
    // does not support this transaction mode, the request fails safely rather than
    // returning a false success.
    const booking = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { id: true },
      });
      if (conflict) return null;

      return tx.booking.create({
        data: {
          customerName: name,
          whatsapp,
          address: location === "HOME" ? address : null,
          service,
          location,
          startAt,
          endAt,
          servicePrice: price.servicePrice,
          mobilityFee: price.mobilityFee,
          totalPrice: price.totalPrice,
        },
        select: { id: true, customerName: true, service: true, location: true, startAt: true, servicePrice: true, mobilityFee: true, totalPrice: true },
      });
    });

    if (!booking) {
      return NextResponse.json({ error: "Esse horário acabou de ser reservado. Escolha outro disponível." }, { status: 409 });
    }
    return NextResponse.json({
      booking: {
        ...booking,
        serviceLabel: ({ HAND: "Mão", FOOT: "Pé", BOTH: "Pé + mão" } as const)[booking.service],
        locationLabel: booking.location === "HOME" ? "Atendimento em domicílio" : "No salão",
        startAt: booking.startAt.toISOString(),
        totalPriceLabel: (booking.totalPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      },
      message: "Agendamento solicitado! Guarde o código e entre em contato com o salão para confirmar o atendimento.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar o agendamento. Confira se o banco está configurado e tente novamente." }, { status: 500 });
  }
}
