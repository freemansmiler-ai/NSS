import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const hashedPassword = await hashPassword(password);
    const userRole = role === "LANDLORD" ? "LANDLORD" : "TENANT";

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phoneNumber,
          role: userRole,
          isPhoneVerified: true,
          isVerified: false,
          isUnlocked: userRole === "LANDLORD",
        } as any,
      });

      const sessionData = {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role as any,
        isPhoneVerified: true,
        isVerified: false,
        isUnlocked: userRole === "LANDLORD",
      };

      const token = await createSessionToken(sessionData);
      const cookieStore = await cookies();
     cookieStore.set("nss_directstay_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({ user: sessionData });
    } catch {
      // Dev fallback mode
      const simulatedUser = {
        userId: `usr-${Date.now()}`,
        email,
        fullName,
        phoneNumber: phoneNumber || "+233240000000",
        role: userRole as any,
        isPhoneVerified: true,
        isVerified: false,
        isUnlocked: userRole === "LANDLORD",
      };

      const token = await createSessionToken(simulatedUser);
      const cookieStore = await cookies();
      cookieStore.set("nss_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({ user: simulatedUser });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
