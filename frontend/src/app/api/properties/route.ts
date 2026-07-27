import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { getProperties, createProperty } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const propertyType = searchParams.get("propertyType") || undefined;
    const facilityType = searchParams.get("facilityType") || undefined;
    const minLeasePeriod = searchParams.get("minLeasePeriod") || undefined;
    const maxPriceParam = searchParams.get("maxPrice");
    const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;
    const area = searchParams.get("area") || undefined;

    const properties = await getProperties({
      search,
      propertyType,
      facilityType,
      minLeasePeriod,
      maxPrice,
      area,
    });

    return NextResponse.json({ properties });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch properties." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nss_session")?.value;
    const session = token ? await verifySessionToken(token) : null;

    const body = await request.json();
    const {
      title,
      propertyType,
      facilityType,
      pricePerMonth,
      minLeasePeriod,
      generalArea,
      exactGhanaPostGps,
      exactStreetAddress,
      latitude,
      longitude,
      description,
      amenities,
      images,
      contactPhone,
      contactWhatsapp,
      paymentRef,
    } = body;

    const isLandlord = session?.role === "LANDLORD";
    const isAdmin = session?.role === "ADMIN";

    if (!isAdmin && isLandlord && !paymentRef) {
      return NextResponse.json(
        { error: "Payment reference for GH₵ 30.00 listing fee is required for Landlord listings." },
        { status: 402 }
      );
    }

    if (!title || !generalArea || !exactGhanaPostGps || !contactPhone) {
      return NextResponse.json(
        { error: "Missing required property fields." },
        { status: 400 }
      );
    }

    const landlordId = session?.userId || `landlord-${Date.now()}`;

    const newProperty = await createProperty({
      landlordId,
      title,
      propertyType,
      facilityType,
      pricePerMonth: Number(pricePerMonth),
      minLeasePeriod,
      generalArea,
      exactGhanaPostGps,
      exactStreetAddress,
      latitude: Number(latitude),
      longitude: Number(longitude),
      description: description || "Spacious, well-ventilated accommodation suitable for NSP personnel.",
      amenities: amenities || ["ECG Prepaid Meter"],
      images: images || ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"],
      contactPhone,
      contactWhatsapp: contactWhatsapp || contactPhone,
      isActive: true,
      paymentRef: paymentRef || (isAdmin ? "ADMIN_FREE" : undefined),
    });

    return NextResponse.json({ property: newProperty }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create property." },
      { status: 500 }
    );
  }
}
