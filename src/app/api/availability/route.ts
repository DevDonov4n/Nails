import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, isValidCalendarDate } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!isValidCalendarDate(date)) {
    return NextResponse.json({ error: "Informe uma data real no formato AAAA-MM-DD." }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date);
    return NextResponse.json(
      { date, slots },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar os horários. Verifique a configuração do banco de dados." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
