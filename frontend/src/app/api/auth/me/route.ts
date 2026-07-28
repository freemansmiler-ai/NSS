import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getUserUnlockedProperties } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const savedById = getUserUnlockedProperties(session.userId);
    const savedByEmail = getUserUnlockedProperties(session.email);
    const sessionUnlocked = Array.isArray(session.unlockedPropertyIds) ? session.unlockedPropertyIds : [];

    const mergedUnlockedIds = Array.from(new Set([...sessionUnlocked, ...savedById, ...savedByEmail]));

    const fullUser = {
      ...session,
      isUnlocked: session.role === "ADMIN" || session.role === "LANDLORD" || session.isUnlocked || mergedUnlockedIds.length > 0,
      unlockedPropertyIds: mergedUnlockedIds,
    };

    return NextResponse.json({ user: fullUser });
  } catch (err: any) {
    return NextResponse.json({ user: null });
  }
}
