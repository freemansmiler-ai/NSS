import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/verification-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (user && !user.isEmailVerified) {
      try {
        const { plainToken } = await createEmailVerificationToken(user.id);
        const verificationUrl = `${appUrl}/verify-email?token=${plainToken}`;
        await sendVerificationEmail({
          toEmail: user.email,
          fullName: user.fullName,
          verificationUrl,
        });
      } catch (err: any) {
        if (err.message?.includes("60 seconds")) {
          return NextResponse.json(
            { error: err.message },
            { status: 429 }
          );
        }
      }
    }

    // Uniform response against account enumeration
    return NextResponse.json({
      success: true,
      message: "If an unverified account with this email exists, a verification link has been sent to your inbox.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to resend verification email." },
      { status: 500 }
    );
  }
}
