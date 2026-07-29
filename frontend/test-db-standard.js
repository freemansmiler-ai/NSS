require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting via standard PrismaClient...");
  try {
    const user = await prisma.user.create({
      data: {
        email: `direct-test-${Date.now()}@nssdirectstay.gh`,
        password: "password123",
        fullName: "Direct Test User",
        phoneNumber: `+233${Math.floor(100000000 + Math.random() * 900000000)}`,
        role: "TENANT",
        isPhoneVerified: true,
        isVerified: true,
      }
    });
    console.log("SUCCESS! Created user in Neon Postgres database:", user);
    const count = await prisma.user.count();
    console.log("Total User count in Neon database:", count);
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
