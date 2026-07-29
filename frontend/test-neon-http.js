require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const sql = neon("postgresql://neondb_owner:npg_Denr4sSIyqU8@ep-square-sound-awns82zc-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function main() {
  console.log("Testing direct Neon HTTP SQL query over Port 443...");
  try {
    const result = await sql`SELECT COUNT(*) FROM users;`;
    console.log("SUCCESS! Neon SQL Count Result:", result);

    const testEmail = `neon-http-${Date.now()}@nssdirectstay.gh`;
    const id = `usr-neon-${Date.now()}`;
    const insertResult = await sql`
      INSERT INTO users (id, email, password, "fullName", "phoneNumber", "isPhoneVerified", "isVerified", "isUnlocked", role, "createdAt", "updatedAt")
      VALUES (${id}, ${testEmail}, 'password123', 'Neon Direct User', ${'+233' + Math.floor(100000000 + Math.random() * 900000000)}, true, true, false, 'TENANT'::"Role", NOW(), NOW())
      RETURNING *;
    `;
    console.log("SUCCESS! Inserted user into Neon Postgres via HTTP:", insertResult);

    const updatedCount = await sql`SELECT COUNT(*) FROM users;`;
    console.log("NEW User Count in Neon SQL Editor:", updatedCount);
  } catch (err) {
    console.error("Neon HTTP Error:", err);
  }
}

main();
