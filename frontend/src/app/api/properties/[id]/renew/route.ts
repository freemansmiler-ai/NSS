import { NextResponse } from "next/server";
import { renewProperty } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { paymentRef } = body;

    if (!paymentRef) {
      return NextResponse.json(
        { error: "Paystack payment reference for GH₵ 30.00 renewal fee is required." },
        { status: 400 }
      );
    }

    const renewed = await renewProperty(id, paymentRef);
    if (!renewed) {
      return NextResponse.json(
        { error: "Property not found or could not be renewed." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Property listing successfully renewed for another 90 days!",
      property: renewed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to renew property." },
      { status: 500 }
    );
  }
}
