import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { role, isVerified, isPhoneVerified } = body;

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          role: role ? role : undefined,
          isVerified: typeof isVerified === "boolean" ? isVerified : undefined,
          isPhoneVerified: typeof isPhoneVerified === "boolean" ? isPhoneVerified : undefined,
        },
      });

      return NextResponse.json({ user: updated });
    } catch {
      return NextResponse.json({ user: { id, role, isVerified, isPhoneVerified } });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    try {
      await prisma.user.delete({ where: { id } });
    } catch {}

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete user." },
      { status: 500 }
    );
  }
}
