import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/security/sessions";

export async function GET() {
  const session = await getCurrentAdminSession();
  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { authenticated: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
