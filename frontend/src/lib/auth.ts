import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "FreemanSmiler"
);

const COOKIE_NAME = "nss_directstay_session";

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: "TENANT" | "LANDLORD" | "ADMIN";
  isPhoneVerified: boolean;
  isVerified: boolean;
  isUnlocked: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  plainText: string,
  hashedText: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hashedText);
}

export async function createSessionToken(user: UserSession): Promise<string> {
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isPhoneVerified: user.isPhoneVerified,
    isVerified: Boolean(user.isVerified),
    isUnlocked: Boolean(user.isUnlocked),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  return token;
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      phoneNumber: payload.phoneNumber as string,
      role: payload.role as "TENANT" | "LANDLORD" | "ADMIN",
      isPhoneVerified: Boolean(payload.isPhoneVerified),
      isVerified: Boolean(payload.isVerified),
      isUnlocked: Boolean(payload.isUnlocked),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

export async function getSessionCookie(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
