import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Deliberately does not auto-link legacy bookings by phone alone.
// A future verified-OTP flow can safely call an equivalent linking operation.
export async function POST(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  return NextResponse.json({
    linked: 0,
    message: "Para proteger seus dados, agendamentos antigos não são associados somente pelo número de WhatsApp. A vinculação será liberada após verificar o controle do número.",
  }, { status: 200 });
}
