import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createUserRecord, findUserByEmailOrPhone } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/verification-email";

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

    const existingUserMatch = await findUserByEmailOrPhone(email, phoneNumber);
    if (existingUserMatch) {
      return NextResponse.json(
        { error: "An account with this phone number or email already exists. Please log in or use a different phone number or email" },
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
      isEmailVerified: false,
      isVerified: false,
      isUnlocked: userRole === "LANDLORD",
    });

    let emailSent = false;
    let emailNotice = "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
      const { plainToken } = await createEmailVerificationToken(user.id);
      const verificationUrl = `${appUrl}/verify-email?token=${plainToken}`;
      const mailRes = await sendVerificationEmail({
        toEmail: user.email,
        fullName: user.fullName,
        verificationUrl,
      });
      emailSent = mailRes.success;
      emailNotice = mailRes.message;
    } catch (mailErr: any) {
      console.error("Frontend registration email dispatch error:", mailErr?.message || mailErr);
      emailNotice = mailErr?.message || "Verification email queueing notice.";
    }

    return NextResponse.json({
      success: true,
      registeredEmail: user.email,
      emailSent,
      message: "Account created successfully! Please check your email inbox for a verification link.",
      emailNotice,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
