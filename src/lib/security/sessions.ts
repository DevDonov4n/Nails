import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const CUSTOMER_SESSION_COOKIE = "nbs_session";
export const ADMIN_SESSION_COOKIE = "nbs_admin_session";

const CUSTOMER_TTL_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_TTL_SECONDS = 60 * 60 * 8;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function customerSessionCookieOptions() {
  return cookieOptions(CUSTOMER_TTL_SECONDS);
}

export function adminSessionCookieOptions() {
  return cookieOptions(ADMIN_TTL_SECONDS);
}

async function createSession(
  principal: { userId: string } | { adminUserId: string },
  ttlSeconds: number,
) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.session.create({
    data: {
      id: randomUUID(),
      tokenHash: hashToken(token),
      userId: "userId" in principal ? principal.userId : null,
      adminUserId: "adminUserId" in principal ? principal.adminUserId : null,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
    },
  });
  return token;
}

export function createCustomerSession(userId: string) {
  return createSession({ userId }, CUSTOMER_TTL_SECONDS);
}

export function createAdminSession(adminUserId: string) {
  return createSession({ adminUserId }, ADMIN_TTL_SECONDS);
}

async function findSession(token: string) {
  if (token.length < 32 || token.length > 128) return null;
  return prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { select: { id: true, name: true, email: true, whatsapp: true, createdAt: true } },
      adminUser: { select: { id: true, email: true } },
    },
  });
}

export async function getCurrentCustomerSession() {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const session = await findSession(token);
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.userId || !session.user || session.adminUserId) return null;
    return { sessionId: session.id, user: session.user };
  } catch {
    return null;
  }
}

export async function getCurrentAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const session = await findSession(token);
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.adminUserId || !session.adminUser || session.userId) return null;
    return { sessionId: session.id, admin: session.adminUser };
  } catch {
    return null;
  }
}

export async function revokeCurrentSession(cookieName: typeof CUSTOMER_SESSION_COOKIE | typeof ADMIN_SESSION_COOKIE) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return;
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function sessionCookieOptions() {
  return customerSessionCookieOptions();
}
