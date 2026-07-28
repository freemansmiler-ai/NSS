import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    return NextResponse.json({ user: session });
  } catch (err: any) {
    return NextResponse.json({ user: null });
  }
}
