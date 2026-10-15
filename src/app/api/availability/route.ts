import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Informe uma data válida." }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date);
    return NextResponse.json({ date, slots });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar os horários. Verifique a configuração do banco de dados." },
      { status: 500 },
    );
  }
}
