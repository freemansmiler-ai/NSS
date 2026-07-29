const { neon } = require("@neondatabase/serverless");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found in .env");
  process.exit(1);
}

const sql = neon(connectionString);

const INITIAL_LANDLORDS = [
  {
    id: "landlord-1",
    email: "kwame.mensah@nssdirectstay.gh",
    fullName: "Chief Kwame Mensah",
    phoneNumber: "+233 24 412 3456",
    role: "LANDLORD",
    isVerified: true
  },
  {
    id: "landlord-2",
    email: "abena.owusu@nssdirectstay.gh",
    fullName: "Mad. Abena Owusu",
    phoneNumber: "+233 20 890 1234",
    role: "LANDLORD",
    isVerified: true
  },
  {
    id: "landlord-3",
    email: "kofi.appiah@nssdirectstay.gh",
    fullName: "Mr. Kofi Appiah",
    phoneNumber: "+233 27 555 6789",
    role: "LANDLORD",
    isVerified: true
  },
  {
    id: "landlord-4",
    email: "grace.tagoe@nssdirectstay.gh",
    fullName: "Auntie Grace Tagoe",
    phoneNumber: "+233 24 333 9988",
    role: "LANDLORD",
    isVerified: true
  }
];

const INITIAL_PROPERTIES = [
  {
    id: "prop-1",
    landlordId: "landlord-1",
    title: "Clean Self-Contain Single Room near UG Legon Campus",
    propertyType: "SINGLE_ROOM",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 380.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Madina - Social Center Area",
    exactGhanaPostGps: "GM-042-8910",
    exactStreetAddress: "Plot 14, Blueberry Street, Madina Social Center",
    latitude: 5.6695,
    longitude: -0.1668,
    description: "Ideal room for NSS personnel posted to UG Legon, Madina Market or Accra North. Features a private bathroom, dedicated ECG prepaid meter, separate kitchen unit, constant Polytank water flow, and high security perimeter fence.",
    amenities: ["ECG Prepaid Meter", "Private Bathroom", "Polytank Water Supply", "Personal Kitchenette", "Fenced Gate & Security Lighting", "Tiled Floor"],
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80"],
    contactPhone: "+233 24 412 3456",
    contactWhatsapp: "233244123456",
    isActive: true,
    viewsCount: 42
  },
  {
    id: "prop-2",
    landlordId: "landlord-2",
    title: "Modern Chamber & Hall Self-Contain near Ridge/Cantonments",
    propertyType: "CHAMBER_AND_HALL",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 650.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Osu - RE Area / Near Danquah Circle",
    exactGhanaPostGps: "GA-032-4411",
    exactStreetAddress: "House 28, Mission Street, Osu RE",
    latitude: 5.5560,
    longitude: -0.1812,
    description: "Spacious chamber and hall apartment perfect for National Service personnel posted to Ministries, Ridge Hospital, Cantonments, or Osu. Private balcony, modern POP ceiling, dedicated water reservoir, and separate ECG meter.",
    amenities: ["POP Ceiling", "Private Bathroom", "Own Balcony", "ECG Prepaid Meter", "Polytank Water Supply", "Compound Car Parking"],
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"],
    contactPhone: "+233 20 890 1234",
    contactWhatsapp: "233208901234",
    isActive: true,
    viewsCount: 68
  },
  {
    id: "prop-3",
    landlordId: "landlord-3",
    title: "Budget-Friendly Single Room near KNUST Campus",
    propertyType: "SINGLE_ROOM",
    facilityType: "SHARED_FACILITIES",
    pricePerMonth: 290.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Kumasi - Ayigya / KNUST Area",
    exactGhanaPostGps: "AK-120-7788",
    exactStreetAddress: "Block B, Ayigya Commercial Area",
    latitude: 6.6731,
    longitude: -1.5670,
    description: "Affordable single room for NSS personnel posted to KNUST, KATH, or Kumasi metropolis. Shared tiled washrooms, high security compound, close to trotro station and market.",
    amenities: ["ECG Prepaid Meter", "Polytank Water Supply", "Fenced Gate & Security Lighting", "Tiled Floor"],
    images: ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80"],
    contactPhone: "+233 27 555 6789",
    contactWhatsapp: "233275556789",
    isActive: true,
    viewsCount: 31
  },
  {
    id: "prop-4",
    landlordId: "landlord-4",
    title: "Executive Single Room Self-Contain near Spintex Road",
    propertyType: "SINGLE_ROOM",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: 450.00,
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "Spintex - Coastal Junction Area",
    exactGhanaPostGps: "GT-102-3344",
    exactStreetAddress: "Plot 88, Coastal Estate Road, Spintex",
    latitude: 5.6200,
    longitude: -0.1000,
    description: "Newly built self-contain single room along Spintex Road. Tiled floors, fitted kitchen cabinet, reliable water supply, and peaceful residential environment.",
    amenities: ["ECG Prepaid Meter", "Private Bathroom", "Personal Kitchenette", "Polytank Water Supply", "Fenced Gate & Security Lighting"],
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80"],
    contactPhone: "+233 24 333 9988",
    contactWhatsapp: "233243339988",
    isActive: true,
    viewsCount: 54
  }
];

async function seed() {
  console.log("Seeding Neon database...");
  try {
    for (const l of INITIAL_LANDLORDS) {
      await sql`
        INSERT INTO users (id, email, password, "fullName", "phoneNumber", role, "isPhoneVerified", "isVerified", "isUnlocked", "createdAt", "updatedAt")
        VALUES (${l.id}, ${l.email}, 'password123', ${l.fullName}, ${l.phoneNumber}, ${l.role}::"Role", true, true, true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log("Inserted landlord:", l.id);
    }

    for (const p of INITIAL_PROPERTIES) {
      await sql`
        INSERT INTO properties (
          id, "landlordId", title, "propertyType", "facilityType", "pricePerMonth",
          "minLeasePeriod", "generalArea", "exactGhanaPostGps", "exactStreetAddress",
          latitude, longitude, description, amenities, images, "contactPhone",
          "contactWhatsapp", "isGpsVerified", "isLandlordVerified", "paymentRef",
          "lastRenewedAt", "viewsCount", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          ${p.id}, ${p.landlordId}, ${p.title}, ${p.propertyType}::"PropertyType",
          ${p.facilityType}::"FacilityType", ${p.pricePerMonth}, ${p.minLeasePeriod}::"LeasePeriod",
          ${p.generalArea}, ${p.exactGhanaPostGps}, ${p.exactStreetAddress},
          ${p.latitude}, ${p.longitude}, ${p.description}, ${p.amenities},
          ${p.images}, ${p.contactPhone}, ${p.contactWhatsapp}, true, true,
          null, NOW(), ${p.viewsCount}, ${p.isActive}, NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
      `;
      console.log("Inserted property:", p.id);
    }
    console.log("Seeding finished successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

seed();
