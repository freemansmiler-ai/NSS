import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { findUserByEmail, fetchUserUnlockedProperties } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ verified: false });
    }

    const isVerified = Boolean(
      user.isEmailVerified === true || user.isemailverified === true
    );

    if (isVerified) {
      const userRole = user.role as any;
      const fetchedUnlocked = await fetchUserUnlockedProperties(user.id, user.email);
      const sessionData = {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber || undefined,
        role: userRole,
        isPhoneVerified: user.isPhoneVerified ?? true,
        isEmailVerified: true,
        isVerified: Boolean(user.isVerified),
        isUnlocked: userRole === "ADMIN" || userRole === "LANDLORD" || Boolean(user.isUnlocked),
        unlockedPropertyIds: fetchedUnlocked,
      };

      const token = await createSessionToken(sessionData);
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({ verified: true, user: sessionData, token });
    }

    return NextResponse.json({ verified: false });
  } catch {
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
