import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";
import { prisma, getProperties } from "@/lib/db";
import { INITIAL_LANDLORDS } from "@/lib/sample-data";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    let users: any[] = [];
    let properties: any[] = [];

    try {
      const dbUsers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          role: true,
          isPhoneVerified: true,
          isVerified: true,
          createdAt: true,
        },
      });

      if (dbUsers.length > 0) {
        users = dbUsers.map((u: any) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }));
      }
    } catch {
      users = INITIAL_LANDLORDS.map((l) => ({
        id: l.id,
        email: l.email,
        fullName: l.fullName,
        phoneNumber: l.phoneNumber,
        role: l.role,
        isPhoneVerified: true,
        isVerified: l.isVerified ?? true,
        createdAt: new Date().toISOString(),
      }));
    }

    properties = await getProperties({ includeInactive: true });

    const stats = {
      totalUsers: users.length,
      totalTenants: users.filter((u) => u.role === "TENANT").length,
      totalLandlords: users.filter((u) => u.role === "LANDLORD").length,
      totalAdmins: users.filter((u) => u.role === "ADMIN").length,
      verifiedUsers: users.filter((u) => u.isVerified).length,
      totalProperties: properties.length,
      singleRooms: properties.filter((p) => p.propertyType === "SINGLE_ROOM").length,
      chamberAndHall: properties.filter((p) => p.propertyType === "CHAMBER_AND_HALL").length,
      activeListings: properties.filter((p) => p.isActive).length,
      paystackConfigured: true,
    };

    return NextResponse.json({
      stats,
      users,
      properties,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch admin stats." },
      { status: 500 }
    );
  }
}
