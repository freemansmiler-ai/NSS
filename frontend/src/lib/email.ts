export interface SendVerificationEmailOptions {
  toEmail: string;
  fullName: string;
  verificationUrl: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  provider?: "BREVO_SMTP" | "BREVO_API" | "DEMO_LOG";
  error?: string;
}

export function isValidEmailFormat(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function generateHtmlEmail({ fullName, verificationUrl }: { fullName: string; verificationUrl: string }): string {
  const appName = "NSS DirectStay Ghana";
  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #020617; color: #f8fafc;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 30px 40px; background-color: #090d16; text-align: center; border-bottom: 1px solid #1e293b;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #10b981; letter-spacing: -0.5px;">${appName}</h1>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Direct Landlord & Housing Portal for National Service Personnel</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Confirm Your Email Address</h2>
                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                    Hello <strong style="color: #ffffff;">${fullName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                    Thank you for registering on ${appName}. Please click the button below to verify your email address and activate your account.
                  </p>

                  <!-- Verify Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px auto;">
                    <tr>
                      <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);">
                        <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #022c22; text-decoration: none; border-radius: 12px;">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 8px 0; font-size: 12px; color: #94a3b8;">
                    Or copy and paste this verification URL into your web browser:
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 12px; word-break: break-all;">
                    <a href="${verificationUrl}" style="color: #34d399; text-decoration: underline;">${verificationUrl}</a>
                  </p>

                  <!-- Expiration & Disclaimer -->
                  <div style="padding: 16px; background-color: #090d16; border: 1px solid #1e293b; border-radius: 12px; margin-top: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #f59e0b; font-weight: 600;">
                      ⏳ Link Expiration Notice
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                      This verification link will expire in <strong>24 hours</strong>. If you did not create an account on ${appName}, please ignore this email. No changes will be made to your account.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #64748b;">
                    &copy; ${year} ${appName}. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function generatePlainTextEmail({ fullName, verificationUrl }: { fullName: string; verificationUrl: string }): string {
  const appName = "NSS DirectStay Ghana";
  return `
Hello ${fullName},

Thank you for registering on ${appName}.

Please verify your email address by visiting the following link:
${verificationUrl}

This verification link will expire in 24 hours.

If you did not create an account on ${appName}, please ignore this email.

Regards,
${appName} Team
  `.trim();
}

export async function sendVerificationEmail(options: SendVerificationEmailOptions): Promise<EmailResult> {
  try {
    const { toEmail, fullName, verificationUrl } = options;

    if (!isValidEmailFormat(toEmail)) {
      return {
        success: false,
        message: `Failed to send email: Malformed or invalid recipient address "${toEmail}".`,
        error: "MALFORMED_RECIPIENT_EMAIL",
      };
    }

    if (!verificationUrl || typeof verificationUrl !== "string" || verificationUrl.trim() === "") {
      return {
        success: false,
        message: "Failed to send email: Missing or invalid verification URL.",
        error: "MISSING_VERIFICATION_URL",
      };
    }

    const htmlContent = generateHtmlEmail({ fullName, verificationUrl });
    const textContent = generatePlainTextEmail({ fullName, verificationUrl });

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_FROM || process.env.SENDER_EMAIL || "noreply@nssdirectstay.gh";
    const senderName = process.env.EMAIL_FROM_NAME || process.env.SENDER_NAME || "NSS DirectStay Ghana";

    if (apiKey) {
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
            to: [{ email: toEmail, name: fullName }],
            subject: "Verify Your Email Address - NSS DirectStay Ghana",
            htmlContent,
            textContent,
          }),
        });

        if (response.ok) {
          return {
            success: true,
            message: `Verification email sent successfully to ${toEmail} via Brevo API.`,
            provider: "BREVO_API",
          };
        }

        const errResponse = await response.text();
        console.error(`Brevo API Error (${response.status}):`, errResponse);
        return {
          success: false,
          message: `Brevo API returned error status ${response.status}.`,
          provider: "BREVO_API",
          error: errResponse,
        };
      } catch (apiErr: any) {
        console.error("Brevo API Connection Error:", apiErr?.message || apiErr);
        return {
          success: false,
          message: "Failed to connect to Brevo Email API.",
          provider: "BREVO_API",
          error: apiErr?.message || String(apiErr),
        };
      }
    }

    console.log("=================================================");
    console.log("📧 DEMO VERIFICATION EMAIL LOG (NO BREVO CREDS SET)");
    console.log(`To: ${toEmail} (${fullName})`);
    console.log(`From: ${senderName} <${senderEmail}>`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log("=================================================");

    return {
      success: true,
      message: `Demo mode: Verification email logged to console for ${toEmail}.`,
      provider: "DEMO_LOG",
    };
  } catch (err: any) {
    console.error("Unhandled Frontend Email Service Exception:", err?.message || err);
    return {
      success: false,
      message: "An unexpected error occurred in the email service.",
      error: err?.message || String(err),
    };
  }
}
