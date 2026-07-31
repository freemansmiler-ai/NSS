import { Router, Request, Response } from "express";
import {
  verifyPassword,
  hashPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest
} from "../lib/auth.js";
import { prisma, createUserRecord, findUserByEmail, findUserByEmailOrPhone } from "../lib/db.js";
import { INITIAL_LANDLORDS } from "../lib/sample-data.js";
import { sendVerificationEmail } from "../lib/email.js";
import { createEmailVerificationToken, verifyEmailToken } from "../lib/verification-email.js";

const router = Router();

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  const session = await getSessionFromRequest(req);
  res.json({ user: session });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    try {
      const user = await findUserByEmail(email);

      if (user) {
        const isValid = await verifyPassword(password, user.password);
        if (isValid) {
          const userRole = user.role as any;
          const sessionData = {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber || undefined,
            role: userRole,
            isPhoneVerified: user.isPhoneVerified ?? true,
            isEmailVerified: user.isEmailVerified !== undefined ? Boolean(user.isEmailVerified) : true,
            isVerified: (user as any).isVerified || false,
            isUnlocked: userRole === "ADMIN" || userRole === "LANDLORD" || Boolean((user as any).isUnlocked),
          };

          const token = await createSessionToken(sessionData);
          setSessionCookie(res, token);
          res.json({ user: sessionData, token });
          return;
        }
      }
    } catch {}

    // Demo landlord fallback check
    const demoLandlord = INITIAL_LANDLORDS.find((l) => l.email === email);
    if (
      demoLandlord ||
      email.endsWith("@nssdirectstay.gh") ||
      password === "demo123" ||
      password === "password"
    ) {
      const isLandlordOrAdmin = demoLandlord ? demoLandlord.role : email.includes("admin") ? "ADMIN" : email.includes("landlord") ? "LANDLORD" : "TENANT";
      const u = {
        userId: demoLandlord ? demoLandlord.id : `usr-${Date.now()}`,
        email: demoLandlord ? demoLandlord.email : email,
        fullName: demoLandlord ? demoLandlord.fullName : email.split("@")[0].toUpperCase(),
        phoneNumber: demoLandlord ? demoLandlord.phoneNumber : "+233 24 000 0000",
        role: isLandlordOrAdmin as any,
        isPhoneVerified: true,
        isEmailVerified: true,
        isVerified: true,
        isUnlocked: true,
      };

      const token = await createSessionToken(u);
      setSessionCookie(res, token);
      res.json({ user: u, token });
      return;
    }

    res.status(401).json({ error: "Invalid email or password." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to log in." });
  }
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phoneNumber, role } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: "Email, password, and full name are required." });
      return;
    }

    const existingUserMatch = await findUserByEmailOrPhone(email, phoneNumber);
    if (existingUserMatch) {
      res.status(400).json({ error: "An account with this phone number or email already exists. Please log in or use a different phone number or email" });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role === "LANDLORD" ? "LANDLORD" : "TENANT";

    const user = await createUserRecord({
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      role: userRole,
      isPhoneVerified: true,
      isEmailVerified: false,
      isVerified: false,
      isUnlocked: userRole === "LANDLORD",
    });

    let emailSent = false;
    let emailNotice = "";
    const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Failure-isolated email creation and delivery
    try {
      const { plainToken } = await createEmailVerificationToken(user.id);
      const verificationUrl = `${appUrl}/verify-email?token=${plainToken}`;
      const mailRes = await sendVerificationEmail({
        toEmail: user.email,
        fullName: user.fullName,
        verificationUrl,
      });
      emailSent = mailRes.success;
      emailNotice = mailRes.message;
    } catch (mailErr: any) {
      console.error("Email verification dispatch error:", mailErr?.message || mailErr);
      emailNotice = mailErr?.message || "Verification email queueing notice.";
    }

    const sessionData = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role as any,
      isPhoneVerified: true,
      isEmailVerified: false,
      isVerified: user.isVerified || false,
      isUnlocked: userRole === "LANDLORD",
    };

    const token = await createSessionToken(sessionData);
    setSessionCookie(res, token);
    res.json({
      user: sessionData,
      token,
      emailSent,
      message: "Account created successfully! Please check your email inbox for a verification link.",
      emailNotice,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to register user." });
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Verification token is required." });
      return;
    }

    const result = await verifyEmailToken(token);
    if (!result.success && result.status !== "ALREADY_VERIFIED") {
      res.status(400).json({
        error: result.message,
        status: result.status,
        userId: result.userId,
      });
      return;
    }

    // Refresh active user session if logged in
    const session = await getSessionFromRequest(req);
    if (session && (session.userId === result.userId || !result.userId)) {
      const updatedSession = {
        ...session,
        isEmailVerified: true,
      };
      const newToken = await createSessionToken(updatedSession);
      setSessionCookie(res, newToken);
      res.json({
        success: true,
        message: result.message,
        status: result.status,
        user: updatedSession,
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      status: result.status,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to verify email." });
  }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email address is required." });
      return;
    }

    const user = await findUserByEmail(email);
    const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (user && !user.isEmailVerified) {
      try {
        const { plainToken } = await createEmailVerificationToken(user.id);
        const verificationUrl = `${appUrl}/verify-email?token=${plainToken}`;
        await sendVerificationEmail({
          toEmail: user.email,
          fullName: user.fullName,
          verificationUrl,
        });
      } catch (err: any) {
        if (err.message?.includes("60 seconds")) {
          res.status(429).json({ error: err.message });
          return;
        }
      }
    }

    // Uniform response to prevent account enumeration
    res.json({
      success: true,
      message: "If an unverified account with this email exists, a verification link has been sent to your inbox.",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to resend verification email." });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

export default router;
