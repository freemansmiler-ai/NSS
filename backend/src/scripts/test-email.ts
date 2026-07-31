import { sendVerificationEmail, isValidEmailFormat } from "../lib/email.js";

async function runEmailServiceTests() {
  console.log("=================================================");
  console.log("🧪 STARTING EMAIL SERVICE SUITE TESTS");
  console.log("=================================================\n");

  const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Test 1: Helper function email format validator
  console.log("--- TEST 1: Email Format Validator ---");
  console.log("Valid email (kwame@nssdirectstay.gh):", isValidEmailFormat("kwame@nssdirectstay.gh") ? "PASSED" : "FAILED");
  console.log("Malformed email (kwamenssdirectstay):", !isValidEmailFormat("kwamenssdirectstay") ? "PASSED" : "FAILED");
  console.log("Empty email (' '):", !isValidEmailFormat("  ") ? "PASSED" : "FAILED");
  console.log("");

  // Test 2: Malformed Recipient Address
  console.log("--- TEST 2: Malformed Recipient Address ---");
  const malformedRes = await sendVerificationEmail({
    toEmail: "not-an-email",
    fullName: "Test User",
    verificationUrl: `${appUrl}/verify-email?token=sample-token-123`,
  });
  console.log("Success:", malformedRes.success === false ? "PASSED (Rejected as expected)" : "FAILED");
  console.log("Message:", malformedRes.message);
  console.log("Error code:", malformedRes.error);
  console.log("");

  // Test 3: Missing Verification URL
  console.log("--- TEST 3: Missing Verification URL ---");
  const missingUrlRes = await sendVerificationEmail({
    toEmail: "test@nssdirectstay.gh",
    fullName: "Test User",
    verificationUrl: "",
  });
  console.log("Success:", missingUrlRes.success === false ? "PASSED (Rejected as expected)" : "FAILED");
  console.log("Error code:", missingUrlRes.error);
  console.log("");

  // Test 4: Missing Credentials / Demo Fallback Mode
  console.log("--- TEST 4: Demo Log Mode (Unconfigured Credentials) ---");
  // Temporarily unset keys to verify graceful demo logger
  const origSmtp = process.env.BREVO_SMTP_USER;
  const origApi = process.env.BREVO_API_KEY;
  delete process.env.BREVO_SMTP_USER;
  delete process.env.BREVO_API_KEY;

  const demoRes = await sendVerificationEmail({
    toEmail: "kwame.mensah@example.com",
    fullName: "Kwame Mensah",
    verificationUrl: `${appUrl}/verify-email?token=abcdef1234567890`,
  });
  console.log("Success:", demoRes.success === true ? "PASSED" : "FAILED");
  console.log("Provider:", demoRes.provider);
  console.log("Message:", demoRes.message);
  console.log("");

  // Restore env
  if (origSmtp) process.env.BREVO_SMTP_USER = origSmtp;
  if (origApi) process.env.BREVO_API_KEY = origApi;

  // Test 5: Invalid SMTP Credentials Failure Isolation
  console.log("--- TEST 5: Invalid SMTP Config Failure Isolation ---");
  process.env.BREVO_SMTP_USER = "invalid_user@smtp.com";
  process.env.BREVO_SMTP_PASSWORD = "wrong_password";
  process.env.BREVO_SMTP_HOST = "smtp-relay.brevo.com";
  process.env.BREVO_SMTP_PORT = "587";
  delete process.env.BREVO_API_KEY;

  const invalidSmtpRes = await sendVerificationEmail({
    toEmail: "user@example.com",
    fullName: "Test User",
    verificationUrl: `${appUrl}/verify-email?token=test-token`,
  });
  console.log("Process survived without crashing:", "PASSED");
  console.log("Result Provider/Status:", invalidSmtpRes.provider, invalidSmtpRes.success);
  console.log("");

  console.log("=================================================");
  console.log("✅ EMAIL SERVICE TEST SUITE COMPLETED");
  console.log("=================================================");
}

runEmailServiceTests().catch((err) => {
  console.error("Test Suite Runner Error:", err);
});
