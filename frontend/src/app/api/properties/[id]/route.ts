import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { updatePropertyStatus, deleteProperty, getPropertyById } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value || request.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const prop = await getPropertyById(id);
    if (!prop) {
      return NextResponse.json({ error: "Property not found." }, { status: 44 });
    }

    const isOwner = prop.landlordId === session.userId || prop.landlord?.email === session.email || prop.landlordId === session.email;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized to update this property." }, { status: 403 });
    }

    const body = await request.json();
    const { isActive } = body;

    const updated = await updatePropertyStatus(id, Boolean(isActive));
    return NextResponse.json({ success: true, property: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update property status." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value || request.headers.get("authorization")?.replace("Bearer ", "");
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const prop = await getPropertyById(id);
    if (prop) {
      const isOwner = prop.landlordId === session.userId || prop.landlord?.email === session.email || prop.landlordId === session.email;
      const isAdmin = session.role === "ADMIN";

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Unauthorized to delete this property." }, { status: 403 });
      }
    }

    await deleteProperty(id);
    return NextResponse.json({ success: true, deletedId: id, message: "Property permanently deleted." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete property." }, { status: 500 });
  }
}
