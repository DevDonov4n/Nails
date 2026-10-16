import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
