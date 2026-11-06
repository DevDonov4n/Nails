import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/security/sessions";

const COOKIE = "nbs_admin_session";
const DEFAULT_FEATURES = [
  { key: "loyalty", enabled: true },
  { key: "referrals", enabled: false },
  { key: "promotional-discounts", enabled: true },
] as const;

export async function GET() {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    await Promise.all(DEFAULT_FEATURES.map((feature) => prisma.platformFeature.upsert({
      where: { key: feature.key },
      create: feature,
      update: {},
    })));
    const [features, events] = await Promise.all([
      prisma.platformFeature.findMany({ orderBy: { key: "asc" } }),
      prisma.platformEvent.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({
      features,
      events: events.map((event) => ({ ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), createdAt: event.createdAt.toISOString() })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao carregar eventos e funcionalidades:", error);
    return NextResponse.json({ error: "Não foi possível carregar as configurações. Verifique se a migração de eventos foi executada." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (typeof body.eventId === "string" && typeof body.active === "boolean") {
    try {
      const event = await prisma.platformEvent.update({
        where: { id: body.eventId },
        data: { active: body.active },
      });
      return NextResponse.json({ event: { ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), createdAt: event.createdAt.toISOString() } }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ error: "Não foi possível atualizar o evento." }, { status: 404 });
    }
  }
  const key = body.key;
  const enabled = body.enabled;
  if (!["loyalty", "referrals", "promotional-discounts"].includes(String(key)) || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Funcionalidade ou estado inválido." }, { status: 400 });
  }
  if (key === "referrals" && enabled) {
    return NextResponse.json({ error: "O programa Indique e Ganhe ainda está em preparação e não pode ser ativado." }, { status: 409 });
  }
  try {
    const feature = await prisma.platformFeature.upsert({
      where: { key: String(key) },
      create: { key: String(key), enabled },
      update: { enabled },
    });
    return NextResponse.json({ feature }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao atualizar funcionalidade:", error);
    return NextResponse.json({ error: "Não foi possível atualizar a funcionalidade." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const type = body.type;
  const startsAtRaw = typeof body.startsAt === "string" ? body.startsAt : "";
  const endsAtRaw = typeof body.endsAt === "string" ? body.endsAt : "";
  const discountPercent = body.discountPercent === undefined || body.discountPercent === null ? null : Number(body.discountPercent);
  if (title.length < 3 || title.length > 100 || type !== "LAUNCH_DISCOUNT") {
    return NextResponse.json({ error: "Informe um título e um tipo de evento válido. A campanha Indique e Ganhe será liberada em uma etapa futura." }, { status: 400 });
  }
  if (type === "LAUNCH_DISCOUNT" && (!Number.isInteger(discountPercent) || (discountPercent as number) < 1 || (discountPercent as number) > 90)) {
    return NextResponse.json({ error: "Informe um percentual de desconto entre 1% e 90%." }, { status: 400 });
  }
  const startsAt = new Date(startsAtRaw);
  const endsAt = new Date(endsAtRaw);
  if (!startsAtRaw || !endsAtRaw || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: "O encerramento deve ser posterior ao início do evento." }, { status: 400 });
  }
  try {
    const event = await prisma.platformEvent.create({
      data: { title, description: description || null, type: String(type), discountPercent: type === "LAUNCH_DISCOUNT" ? discountPercent : null, startsAt, endsAt },
    });
    return NextResponse.json({ event: { ...event, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(), createdAt: event.createdAt.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json({ error: "Não foi possível salvar o evento." }, { status: 503 });
  }
}
