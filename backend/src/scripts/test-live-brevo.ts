import dotenv from "dotenv";
dotenv.config();

async function testLiveBrevoAPI() {
  console.log("=================================================");
  console.log("🔍 TESTING LIVE BREVO API CONNECTION");
  console.log("=================================================");

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;
  const senderName = process.env.EMAIL_FROM_NAME || "NSS DirectStay Ghana";

  console.log("API Key Present:", apiKey ? `Yes (${apiKey.substring(0, 15)}...)` : "NO");
  console.log("Sender Email:", senderEmail);

  if (!apiKey || !senderEmail) {
    console.error("❌ Missing BREVO_API_KEY or EMAIL_FROM in environment!");
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: senderEmail, name: "Test Recipient" }],
        subject: "Brevo Test Email - NSS DirectStay Ghana",
        htmlContent: "<h1>Test Email</h1><p>Testing Brevo API integration live.</p>",
        textContent: "Testing Brevo API integration live.",
      }),
    });

    console.log("Response Status Code:", response.status, response.statusText);
    const bodyText = await response.text();
    console.log("Response Body:", bodyText);

    if (response.ok) {
      console.log("✅ LIVE BREVO EMAIL DISPATCHED SUCCESSFULLY!");
    } else {
      console.error("❌ BREVO API REJECTED DISPATCH!");
    }
  } catch (err: any) {
    console.error("❌ Network or Exception Error:", err?.message || err);
  }
}

testLiveBrevoAPI();
