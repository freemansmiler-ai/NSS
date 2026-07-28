import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { updatePropertyStatus, deleteProperty } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value || request.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? await verifySessionToken(token) : null;

    if (token && session?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive boolean parameter is required." },
        { status: 400 }
      );
    }

    const updated = await updatePropertyStatus(id, isActive);
    return NextResponse.json({
      success: true,
      property: updated,
      message: isActive ? "Property successfully relisted." : "Property successfully delisted by Admin.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update property status." },
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
    const token = cookieStore.get(COOKIE_NAME)?.value || request.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? await verifySessionToken(token) : null;

    if (token && session?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await deleteProperty(id);

    return NextResponse.json({
      success: true,
      deletedId: id,
      message: "Property permanently deleted from system.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete property." },
      { status: 500 }
    );
  }
}
