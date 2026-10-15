import { BookingLocation, BookingService, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { calculatePrice, isWithinBusinessHours, parseLocalDateTime, APPOINTMENT_MINUTES } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

const services = new Set<BookingService>(["HAND", "FOOT", "BOTH"]);
const locations = new Set<BookingLocation>(["SALON", "HOME"]);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const service = body.service as BookingService;
  const location = body.location as BookingLocation;
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";

  if (name.length < 2 || whatsapp.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "Informe seu nome e um WhatsApp válido com DDD." }, { status: 400 });
  }
  if (!services.has(service) || !locations.has(location)) {
    return NextResponse.json({ error: "Selecione um tratamento e o local do atendimento." }, { status: 400 });
  }
  if (location === "HOME" && address.length < 8) {
    return NextResponse.json({ error: "Informe o endereço completo para atendimento em domicílio." }, { status: 400 });
  }

  const startAt = parseLocalDateTime(date, time);
  if (!startAt || startAt <= new Date()) {
    return NextResponse.json({ error: "Escolha uma data e um horário futuro válido." }, { status: 400 });
  }
  const endAt = new Date(startAt.getTime() + APPOINTMENT_MINUTES * 60_000);
  if (!isWithinBusinessHours(startAt, endAt)) {
    return NextResponse.json({ error: "Esse horário está fora do expediente. Seg–sex: 16h–20h; sáb–dom: 9h–18h." }, { status: 400 });
  }

  const price = calculatePrice(service, location);
  try {
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

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
