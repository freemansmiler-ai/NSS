require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { Pool, neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Denr4sSIyqU8@ep-square-sound-awns82zc-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require";
process.env.DATABASE_URL = connectionString;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to Neon Postgres over WebSockets Pooler (port 443)...");
  try {
    const count = await prisma.user.count();
    console.log("Current user count in Neon Postgres:", count);

    const testEmail = `test-db-${Date.now()}@nssdirectstay.gh`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashedpassword123",
        fullName: "Neon Test User",
        phoneNumber: `+233${Math.floor(100000000 + Math.random() * 900000000)}`,
        role: "TENANT",
        isPhoneVerified: true,
        isVerified: true,
      }
    });

    console.log("SUCCESS! Created user in Neon Postgres database:", user);
    const newCount = await prisma.user.count();
    console.log("Updated user count in Neon Postgres:", newCount);
  } catch (err) {
    console.error("FAILED to insert into Neon Postgres:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
