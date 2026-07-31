import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, getSessionCookie, COOKIE_NAME } from "@/lib/auth";
import { findUserById, fetchUserUnlockedProperties } from "@/lib/db";
import { verifyEmailToken } from "@/lib/verification-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    const result = await verifyEmailToken(token);

    if (!result.success && result.status !== "ALREADY_VERIFIED") {
      return NextResponse.json(
        {
          error: result.message,
          status: result.status,
          userId: result.userId,
        },
        { status: 400 }
      );
    }

    let sessionData: any = null;
    if (result.userId) {
      const dbUser = await findUserById(result.userId);
      if (dbUser) {
        const userRole = dbUser.role as any;
        const fetchedUnlocked = await fetchUserUnlockedProperties(dbUser.id, dbUser.email);
        sessionData = {
          userId: dbUser.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
          phoneNumber: dbUser.phoneNumber || undefined,
          role: userRole,
          isPhoneVerified: dbUser.isPhoneVerified ?? true,
          isEmailVerified: true,
          isVerified: Boolean(dbUser.isVerified),
          isUnlocked: userRole === "ADMIN" || userRole === "LANDLORD" || Boolean(dbUser.isUnlocked),
          unlockedPropertyIds: fetchedUnlocked,
        };

        const newToken = await createSessionToken(sessionData);
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    }

    if (!sessionData) {
      const session = await getSessionCookie();
      if (session) {
        sessionData = { ...session, isEmailVerified: true };
        const newToken = await createSessionToken(sessionData);
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      status: result.status,
      user: sessionData,
      token: sessionData ? await createSessionToken(sessionData) : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify email." },
      { status: 500 }
    );
  }
}
