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

/** Validates a real calendar date and a 24-hour time, interpreted as São Paulo time. */
export function parseLocalDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  // The salon's business rules use America/Sao_Paulo local time.
  return new Date(`${date}T${time}:00-03:00`);
}

export function isValidCalendarDate(date: string) {
  return parseLocalDateTime(date, "12:00") !== null;
}

export function getBusinessHours(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(date);
  const day = ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as const)[parts as "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"];
  return day >= 1 && day <= 5 ? { open: 16, close: 20 } : { open: 9, close: 18 };
}

function getSaoPauloParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

export function isWithinBusinessHours(startAt: Date, endAt: Date) {
  const start = getSaoPauloParts(startAt);
  const end = getSaoPauloParts(endAt);
  const hours = getBusinessHours(startAt);

  return Number(start.minute) === 0 &&
    Number(start.hour) >= hours.open &&
    Number(end.hour) <= hours.close &&
    Number(end.minute) === 0 &&
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day;
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
