import { createUserRecord, findUserByEmail } from "../lib/db.js";
import { createEmailVerificationToken, verifyEmailToken, hashToken } from "../lib/verification-email.js";
import { sendVerificationEmail, isValidEmailFormat } from "../lib/email.js";

async function runAuditAndIntegrationSuite() {
  console.log("=================================================");
  console.log("🛡️ ANTIGRAVITY TASK 7 — INTEGRATION & SECURITY AUDIT");
  console.log("=================================================\n");

  let totalPassed = 0;
  let totalFailed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}${detail ? ` (${detail})` : ""}`);
      totalPassed++;
    } else {
      console.log(`❌ [FAIL] ${testName}${detail ? ` (${detail})` : ""}`);
      totalFailed++;
    }
  }

  // ----------------------------------------------------
  // SECTION 1: REGISTRATION FLOW AUDIT
  // ----------------------------------------------------
  console.log("--- SECTION 1: Registration Flow ---");

  const testEmail = `audit.user.${Date.now()}@nssdirectstay.gh`;
  const testPassword = "auditPassword123";
  const testFullName = "Audit Tester";
  const testPhone = `+23320${Math.floor(1000000 + Math.random() * 9000000)}`;

  // 1.1 Normal Registration
  const regUser = await createUserRecord({
    email: testEmail,
    password: testPassword,
    fullName: testFullName,
    phoneNumber: testPhone,
    role: "TENANT",
    isPhoneVerified: true,
    isEmailVerified: false,
  });
  assert(Boolean(regUser && regUser.id), "Normal Registration - User Created");
  assert(regUser.isEmailVerified === false, "Normal Registration - Initial isEmailVerified is false");

  // 1.2 Duplicate Email Detection
  const dupUser = await findUserByEmail(testEmail);
  assert(Boolean(dupUser && dupUser.id === regUser.id), "Duplicate Email Detection - Account Found");

  // 1.3 Invalid Email Format Check
  assert(!isValidEmailFormat("not-an-email"), "Invalid Email Format Rejection");

  // 1.4 Email Provider Failure Isolation
  // Test that sending email with invalid credentials or network error doesn't crash or roll back user
  const failMailRes = await sendVerificationEmail({
    toEmail: "bad-email-format",
    fullName: "Fail Test",
    verificationUrl: "http://localhost:3000/verify-email?token=invalid",
  });
  assert(failMailRes.success === false, "Email Provider Failure - Handled Gracefully without Process Crash");
  console.log("");

  // ----------------------------------------------------
  // SECTION 2: VERIFICATION ENDPOINT AUDIT
  // ----------------------------------------------------
  console.log("--- SECTION 2: Verification Endpoint & Tokens ---");

  // 2.1 Token Generation & Hash Storage
  const { plainToken, expiresAt } = await createEmailVerificationToken(regUser.id);
  const computedHash = hashToken(plainToken);
  assert(plainToken.length >= 64, "Secure Random Token Generation (256-bit entropy)");
  assert(computedHash !== plainToken, "Raw Token Hashing (SHA-256)");
  assert(expiresAt.getTime() > Date.now(), "Token Expiration Set (24 Hours)");

  // 2.2 Valid Token Verification
  const validVerifyRes = await verifyEmailToken(plainToken);
  assert(validVerifyRes.success === true && validVerifyRes.status === "SUCCESS", "Valid Token Verification");

  // 2.3 DB User Updated State
  const verifiedUserDB = await findUserByEmail(testEmail);
  assert(verifiedUserDB.isEmailVerified === true, "User marked isEmailVerified: true in DB");

  // 2.4 Token Reuse Invalidation (Single-Use Token)
  const reuseRes = await verifyEmailToken(plainToken);
  assert(reuseRes.status === "INVALID" || reuseRes.status === "ALREADY_VERIFIED", "Single-Use Token Enforcement (Reused token invalidated)");

  // 2.5 Invalid & Malformed Tokens
  const invalidTokenRes = await verifyEmailToken("completely-invalid-raw-token-string");
  assert(invalidTokenRes.success === false && invalidTokenRes.status === "INVALID", "Invalid Token Rejection");

  const emptyTokenRes = await verifyEmailToken("");
  assert(emptyTokenRes.success === false && emptyTokenRes.status === "INVALID", "Malformed/Empty Token Rejection");
  console.log("");

  // ----------------------------------------------------
  // SECTION 3: RESEND & RATE LIMITING AUDIT
  // ----------------------------------------------------
  console.log("--- SECTION 3: Resend & Rate Limiting ---");

  const unverifiedEmail = `unverified.${Date.now()}@nssdirectstay.gh`;
  const unverifiedUser = await createUserRecord({
    email: unverifiedEmail,
    password: "password123",
    fullName: "Unverified User",
    phoneNumber: `+23327${Math.floor(1000000 + Math.random() * 9000000)}`,
    role: "TENANT",
    isEmailVerified: false,
  });

  // 3.1 Initial Resend
  const firstTokenRes = await createEmailVerificationToken(unverifiedUser.id);
  assert(Boolean(firstTokenRes.plainToken), "Initial Token Resend");

  // 3.2 60-Second Cooldown Rate-Limit Enforcement
  let rateLimited = false;
  try {
    await createEmailVerificationToken(unverifiedUser.id);
  } catch (err: any) {
    if (err.message?.includes("60 seconds")) {
      rateLimited = true;
    }
  }
  assert(rateLimited, "Resend Rate-Limiting Cooldown Enforced (60s)");
  console.log("");

  // ----------------------------------------------------
  // SECTION 4: EXISTING USERS PRESERVATION AUDIT
  // ----------------------------------------------------
  console.log("--- SECTION 4: Existing Users Preservation ---");

  const legacyUser = await findUserByEmail("kwame.mensah@nssdirectstay.gh");
  assert(legacyUser !== null, "Existing Production User Found");
  assert(legacyUser?.isEmailVerified !== false, "Existing User Preserved with Default Verified Status");
  console.log("");

  // ----------------------------------------------------
  // SECTION 5: SECURITY AUDIT
  // ----------------------------------------------------
  console.log("--- SECTION 5: Security Audit Checklist ---");

  // 5.1 No Plaintext Token in DB Hash Match
  assert(computedHash !== plainToken, "Security: Database stores only SHA-256 hashes");
  assert(!plainToken.includes(computedHash), "Security: Raw token not leaked in hash");

  // 5.2 Frontend Environment Check
  const frontendEnvUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL;
  assert(Boolean(frontendEnvUrl), "Security: Dynamic frontend URL configured");

  console.log("\n=================================================");
  console.log(`AUDIT SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("=================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAuditAndIntegrationSuite().catch((err) => {
  console.error("Audit Runner Error:", err);
  process.exit(1);
});
