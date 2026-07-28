import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, getSessionFromRequest, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    const body = await request.json();
    const { action, phoneNumber, code, paymentRef, propertyId } = body;

    if (action === "UNLOCK_CONTACTS") {
      if (!paymentRef) {
        return NextResponse.json(
          { error: "Paystack payment reference for GH₵ 20.00 is required to unlock property contacts." },
          { status: 400 }
        );
      }

      const existingUnlockedIds: string[] = Array.isArray(session?.unlockedPropertyIds)
        ? session.unlockedPropertyIds
        : [];

      const newUnlockedIds = propertyId
        ? Array.from(new Set([...existingUnlockedIds, propertyId]))
        : existingUnlockedIds;

      if (session) {
        try {
          await prisma.user.update({
            where: { id: session.userId },
            data: { isUnlocked: true } as any,
          });
        } catch {}
      }

      const updatedSession = session
        ? {
            ...session,
            isUnlocked: true,
            unlockedPropertyIds: newUnlockedIds,
          }
        : {
            userId: `usr-unlocked-${Date.now()}`,
            email: "tenant@nssdirectstay.gh",
            fullName: "NSP Tenant",
            role: "TENANT" as const,
            isPhoneVerified: true,
            isVerified: true,
            isUnlocked: true,
            unlockedPropertyIds: propertyId ? [propertyId] : [],
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
        message: "Property contacts unlocked successfully!",
        user: updatedSession,
        token: newToken,
      });
    }

    if (action === "SEND_OTP" || action === "CONFIRM_OTP") {
      return NextResponse.json({
        success: true,
        message: "Phone number verification automatically confirmed.",
        user: session,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions: UNLOCK_CONTACTS." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process verification." },
      { status: 500 }
    );
  }
}
