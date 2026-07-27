const { neon } = require("@neondatabase/serverless");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Connecting via Neon Serverless HTTP API...");

  if (!connectionString) {
    console.error("❌ DATABASE_URL is missing in .env");
    return;
  }

  try {
    const sql = neon(connectionString);

    // Create ENUM types if not exist
    await sql`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('TENANT', 'LANDLORD', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "PropertyType" AS ENUM ('SINGLE_ROOM', 'CHAMBER_AND_HALL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "FacilityType" AS ENUM ('SELF_CONTAIN', 'SHARED_FACILITIES');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "LeasePeriod" AS ENUM ('TEN_MONTHS', 'ONE_YEAR', 'TWO_YEARS_PLUS');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "phoneNumber" TEXT UNIQUE NOT NULL,
        "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
        "role" "Role" NOT NULL DEFAULT 'TENANT',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create properties table
    await sql`
      CREATE TABLE IF NOT EXISTS "properties" (
        "id" TEXT PRIMARY KEY,
        "landlordId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" TEXT NOT NULL,
        "propertyType" "PropertyType" NOT NULL,
        "facilityType" "FacilityType" NOT NULL,
        "pricePerMonth" DECIMAL(10,2) NOT NULL,
        "minLeasePeriod" "LeasePeriod" NOT NULL DEFAULT 'TEN_MONTHS',
        "generalArea" TEXT NOT NULL,
        "exactGhanaPostGps" TEXT NOT NULL,
        "exactStreetAddress" TEXT NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "description" TEXT NOT NULL,
        "amenities" TEXT[] NOT NULL DEFAULT '{}',
        "images" TEXT[] NOT NULL DEFAULT '{}',
        "contactPhone" TEXT NOT NULL,
        "contactWhatsapp" TEXT NOT NULL,
        "isGpsVerified" BOOLEAN NOT NULL DEFAULT true,
        "isLandlordVerified" BOOLEAN NOT NULL DEFAULT true,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("🎉 Database schema & tables initialized successfully on Neon PostgreSQL!");
  } catch (err) {
    console.error("❌ Neon HTTP Execution Error:", err.message || err);
  }
}

main();
