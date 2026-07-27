import { PrismaClient } from "@prisma/client";
import { INITIAL_LANDLORDS, INITIAL_PROPERTIES } from "../src/lib/sample-data.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Prisma database seed...");

  // Seed Landlord Users
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  for (const landlord of INITIAL_LANDLORDS) {
    await prisma.user.upsert({
      where: { email: landlord.email },
      update: {
        fullName: landlord.fullName,
        phoneNumber: landlord.phoneNumber,
        isVerified: landlord.isVerified ?? true,
      },
      create: {
        id: landlord.id,
        email: landlord.email,
        password: hashedPassword,
        fullName: landlord.fullName,
        phoneNumber: landlord.phoneNumber,
        role: "LANDLORD",
        isPhoneVerified: true,
        isVerified: landlord.isVerified ?? true,
      },
    });
    console.log(`👤 Seeded User: ${landlord.fullName} (${landlord.email})`);
  }

  // Seed Properties
  for (const prop of INITIAL_PROPERTIES) {
    await prisma.property.upsert({
      where: { id: prop.id },
      update: {
        title: prop.title,
        pricePerMonth: prop.pricePerMonth,
        generalArea: prop.generalArea,
        exactGhanaPostGps: prop.exactGhanaPostGps,
        exactStreetAddress: prop.exactStreetAddress,
        latitude: prop.latitude,
        longitude: prop.longitude,
        description: prop.description,
        amenities: prop.amenities,
        images: prop.images,
        contactPhone: prop.contactPhone,
        contactWhatsapp: prop.contactWhatsapp,
        isActive: prop.isActive,
      },
      create: {
        id: prop.id,
        landlordId: prop.landlordId,
        title: prop.title,
        propertyType: prop.propertyType,
        facilityType: prop.facilityType,
        pricePerMonth: prop.pricePerMonth,
        minLeasePeriod: prop.minLeasePeriod,
        generalArea: prop.generalArea,
        exactGhanaPostGps: prop.exactGhanaPostGps,
        exactStreetAddress: prop.exactStreetAddress,
        latitude: prop.latitude,
        longitude: prop.longitude,
        description: prop.description,
        amenities: prop.amenities,
        images: prop.images,
        contactPhone: prop.contactPhone,
        contactWhatsapp: prop.contactWhatsapp,
        isActive: prop.isActive,
        isGpsVerified: true,
        isLandlordVerified: true,
      },
    });
    console.log(`🏠 Seeded Property: ${prop.title}`);
  }

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
