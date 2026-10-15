import { BookingLocation, BookingService, BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SERVICE_PRICES: Record<BookingService, number> = {
  HAND: 3000,
  FOOT: 3500,
  BOTH: 6000,
};

export const SERVICE_LABELS: Record<BookingService, string> = {
  HAND: "Mão",
  FOOT: "Pé",
  BOTH: "Pé + mão",
};

export const MOBILITY_FEE = 500;
export const APPOINTMENT_MINUTES = 60;
const ACTIVE_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED"];

export function parseLocalDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const value = new Date(`${date}T${time}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function getBusinessHours(date: Date) {
  // Use the appointment's São Paulo calendar date.
  const local = new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const day = local.getDay();
  return day >= 1 && day <= 5 ? { open: 16, close: 20 } : { open: 9, close: 18 };
}

export function isWithinBusinessHours(startAt: Date, endAt: Date) {
  const localStart = new Date(startAt.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const localEnd = new Date(endAt.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const hours = getBusinessHours(startAt);
  return localStart.getMinutes() === 0 &&
    localStart.getHours() >= hours.open &&
    localEnd.getHours() <= hours.close &&
    localEnd.getMinutes() === 0 &&
    localStart.toDateString() === localEnd.toDateString();
}

export async function getAvailableSlots(date: string) {
  const dayStart = parseLocalDateTime(date, "00:00");
  if (!dayStart) return [];
  const hours = getBusinessHours(dayStart);
  const now = new Date();
  const slots: string[] = [];

  for (let hour = hours.open; hour + 1 <= hours.close; hour++) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    const startAt = parseLocalDateTime(date, time);
    if (!startAt || startAt <= now) continue;
    const endAt = new Date(startAt.getTime() + APPOINTMENT_MINUTES * 60_000);
    const conflict = await prisma.booking.findFirst({
      where: {
        status: { in: ACTIVE_STATUSES },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (!conflict) slots.push(time);
  }

  return slots;
}

export function calculatePrice(service: BookingService, location: BookingLocation) {
  const servicePrice = SERVICE_PRICES[service];
  const mobilityFee = location === "HOME" ? MOBILITY_FEE : 0;
  return { servicePrice, mobilityFee, totalPrice: servicePrice + mobilityFee };
}
