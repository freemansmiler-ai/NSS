import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { prisma, createUserRecord, findUserByEmail } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, phoneNumber, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role === "LANDLORD" ? "LANDLORD" : "TENANT";

    const user = await createUserRecord({
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      role: userRole,
      isPhoneVerified: true,
      isVerified: false,
      isUnlocked: userRole === "LANDLORD",
    });

    const sessionData = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role as any,
      isPhoneVerified: true,
      isVerified: user.isVerified || false,
      isUnlocked: userRole === "LANDLORD" || Boolean(user.isUnlocked),
      unlockedPropertyIds: user.unlockedPropertyIds || [],
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

    return NextResponse.json({ user: sessionData, token });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
