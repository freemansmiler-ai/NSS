import { NextResponse } from "next/server";
import { incrementPropertyViews } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewsCount = await incrementPropertyViews(id);

    return NextResponse.json({
      success: true,
      viewsCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to record property view." },
      { status: 500 }
    );
  }
}
