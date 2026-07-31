import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, getSessionCookie, COOKIE_NAME } from "@/lib/auth";
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

    // Refresh active session if user is logged in
    const session = await getSessionCookie();
    if (session && (session.userId === result.userId || !result.userId)) {
      const updatedSession = {
        ...session,
        isEmailVerified: true,
      };

      const newToken = await createSessionToken(updatedSession);
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        status: result.status,
        user: updatedSession,
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      status: result.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify email." },
      { status: 500 }
    );
  }
}
