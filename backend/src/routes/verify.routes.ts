import { Router, Request, Response } from "express";
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  formatGhanaPhoneNumber
} from "../lib/verification.js";
import { getSessionFromRequest, createSessionToken, setSessionCookie } from "../lib/auth.js";
import { prisma } from "../lib/db.js";

const router = Router();

// POST /api/verify
router.post("/", async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    const { action, phoneNumber, code } = req.body;

    if (action === "SEND_OTP") {
      const inputPhone = (phoneNumber || req.body.target || "").trim();
      if (!inputPhone) {
        res.status(400).json({ error: "Please enter a valid Ghanaian phone number (e.g., 0241234567)." });
        return;
      }

      try {
        const result = await sendPhoneOtp(inputPhone);
        res.json({
          success: true,
          phoneNumber: result.phoneNumber,
          displayPhone: result.displayPhone,
          realDispatched: result.realDispatched,
          message: result.message,
          debugOtp: result.debugOtp,
        });
        return;
      } catch (err: any) {
        res.status(400).json({ error: err.message || "Failed to format or send OTP." });
        return;
      }
    }

    if (action === "CONFIRM_OTP") {
      const inputPhone = (phoneNumber || req.body.target || "").trim();
      const inputCode = (code || "").trim();

      if (!inputPhone || !inputCode) {
        res.status(400).json({ error: "Phone number and 6-digit OTP code are required." });
        return;
      }

      let formatted;
      try {
        formatted = formatGhanaPhoneNumber(inputPhone);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
        return;
      }

      const isValid = await verifyPhoneOtp(formatted, inputCode);
      if (!isValid) {
        res.status(400).json({ error: "Invalid or expired OTP code. Please check your SMS and try again." });
        return;
      }

      if (session) {
        try {
          await prisma.user.update({
            where: { id: session.userId },
            data: { isPhoneVerified: true, phoneNumber: inputPhone },
          });
        } catch {}

        const updatedSession = {
          ...session,
          phoneNumber: inputPhone,
          isPhoneVerified: true,
        };

        const newToken = await createSessionToken(updatedSession);
        setSessionCookie(res, newToken);

        res.json({
          success: true,
          verification: {
            isValid: true,
            message: `Phone number successfully verified via SMS OTP.`,
          },
          user: updatedSession,
        });
        return;
      }

      res.json({
        success: true,
        verification: {
          isValid: true,
          message: `Phone number successfully verified via SMS OTP.`,
        },
      });
      return;
    }

    if (action === "UNLOCK_CONTACTS") {
      const { paymentRef } = req.body;
      if (!paymentRef) {
        res.status(400).json({ error: "Paystack payment reference for GH₵ 20.00 is required to unlock property contacts and GPS address." });
        return;
      }

      if (session) {
        try {
          await prisma.user.update({
            where: { id: session.userId },
            data: { isUnlocked: true },
          });
        } catch {}

        const updatedSession = {
          ...session,
          isUnlocked: true,
        };

        const newToken = await createSessionToken(updatedSession);
        setSessionCookie(res, newToken);

        res.json({
          success: true,
          message: "GhanaPostGPS address, Call line, and WhatsApp contact features unlocked successfully!",
          user: updatedSession,
        });
        return;
      }

      res.json({
        success: true,
        message: "GhanaPostGPS address, Call line, and WhatsApp contact features unlocked successfully!",
      });
      return;
    }

    res.status(400).json({ error: "Invalid action. Supported actions: UNLOCK_CONTACTS, SEND_OTP, CONFIRM_OTP." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process verification." });
  }
});

export default router;
