import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nss_session")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = await verifySessionToken(token);
    return NextResponse.json({ user: session });
  } catch (err: any) {
    return NextResponse.json({ user: null });
  }
}
