import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  createCustomerSession,
  customerSessionCookieOptions,
  getCurrentCustomerSession,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/security/sessions";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  if (expected.length !== 64) return false;
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const AUTH_COOKIE_NAME = CUSTOMER_SESSION_COOKIE;
export {
  createCustomerSession as createSessionToken,
  customerSessionCookieOptions as sessionCookieOptions,
};

export async function getCurrentUser() {
  const session = await getCurrentCustomerSession();
  return session?.user ?? null;
}
