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
  } catch {
    return false;
  }
}

const money = (value: number) => Math.round(value);

function startOfDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value);
  const day = Number(parts.find(p => p.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day, 3));
}
function startOfMonth(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value);
  return new Date(Date.UTC(year, month - 1, 1, 3));
}
function nextMonthStart(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value);
  return new Date(Date.UTC(year + (month === 12 ? 1 : 0), month === 12 ? 0 : month, 1, 3));
}
function startOfYear(date: Date) {
  const year = Number(new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(date));
  return new Date(Date.UTC(year, 0, 1, 3));
}
function getLocalMonth(date: Date) {
  return Number(new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", month: "numeric" }).format(date));
}
function getLocalYear(date: Date) {
  return Number(new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(date));
}

export async function GET() {
  if (!(await adminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);
    const dayStart = startOfDay(now);
    const tomorrow = new Date(dayStart.getTime() + 86_400_000);
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(now);\n    const weekdayIndex = ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as const)[weekday as "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"];\n    const weekStart = new Date(dayStart.getTime() - ((weekdayIndex + 6) % 7) * 86_400_000);\n    const nextWeek = new Date(weekStart.getTime() + 7 * 86_400_000);\n    const nextMonth = nextMonthStart(now);
    const nextYear = new Date(Date.UTC(getLocalYear(now) + 1, 0, 1, 3));

    const [all, admin] = await Promise.all([
      prisma.booking.findMany({
        where: { startAt: { gte: yearStart, lt: nextYear } },
        select: { id: true, customerName: true, whatsapp: true, service: true, location: true, startAt: true, status: true, totalPrice: true, createdAt: true },
        orderBy: { startAt: "desc" },
      }),
      prisma.adminUser.findFirst({ select: { id: true, yearlyGoal: true } }),
    ]);
    const finished = all.filter(item => item.status === "COMPLETED");
    const inDay = all.filter(item => item.startAt >= dayStart && item.startAt < tomorrow && item.status !== "CANCELLED");
    const inWeek = all.filter(item => item.startAt >= weekStart && item.startAt < nextWeek && item.status !== "CANCELLED");
    const inMonth = all.filter(item => item.startAt >= monthStart && item.startAt < nextMonth && item.status !== "CANCELLED");
    const activeFuture = all.filter(item => item.startAt >= now && (item.status === "PENDING" || item.status === "CONFIRMED"));
    const revenue = finished.reduce((sum, item) => sum + item.totalPrice, 0);
    const forecast = revenue + activeFuture.reduce((sum, item) => sum + item.totalPrice, 0);
    const year = getLocalYear(now);
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const done = finished.filter(item => getLocalYear(item.startAt) === year && getLocalMonth(item.startAt) === month);
      const bookings = all.filter(item => getLocalYear(item.startAt) === year && getLocalMonth(item.startAt) === month && item.status !== "CANCELLED");
      return { month: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(Date.UTC(year, index, 15))).replace(".", ""), revenue: done.reduce((sum, item) => sum + item.totalPrice, 0) / 100, appointments: bookings.length, completed: done.length };
    });
    const recent = all.slice(0, 8).map(item => ({
      id: item.id,
      customerName: item.customerName,
      service: ({ HAND: "Mão", FOOT: "Pé", BOTH: "Mão + pé" } as const)[item.service],
      date: item.startAt.toISOString(),
      status: item.status,
      totalPrice: item.totalPrice / 100,
      whatsapp: item.whatsapp,
    }));
    return NextResponse.json({
      year, goal: admin?.yearlyGoal ?? 0,
      summary: {
        today: inDay.length, week: inWeek.length, month: inMonth.length,
        revenue: revenue / 100, forecast: forecast / 100,
        finishedToday: inDay.filter(item => item.status === "COMPLETED").length,
      },
      months, recent,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao carregar dashboard administrativo:", error);
    return NextResponse.json({ error: "Não foi possível carregar os dados do dashboard. Verifique a migração do banco." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await adminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const goal = (body as Record<string, unknown>).goal;
  if (typeof goal !== "number" || !Number.isFinite(goal) || goal < 0 || goal > 100_000_000) {
    return NextResponse.json({ error: "Informe uma meta anual válida." }, { status: 400 });
  }
  try {
    const admin = await prisma.adminUser.findFirst({ select: { id: true } });
    if (!admin) return NextResponse.json({ error: "Cadastre o administrador primeiro." }, { status: 503 });
    const updated = await prisma.adminUser.update({ where: { id: admin.id }, data: { yearlyGoal: money(goal) }, select: { yearlyGoal: true } });
    return NextResponse.json({ goal: updated.yearlyGoal });
  } catch (error) {
    console.error("Erro ao atualizar meta administrativa:", error);
    return NextResponse.json({ error: "Não foi possível salvar a meta." }, { status: 503 });
  }
}
