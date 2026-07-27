/**
 * NSS DirectStay Ghana - SMS OTP Verification Module
 */

interface OtpEntry {
  code: string;
  expiresAt: number;
}
const otpStore = new Map<string, OtpEntry>();

export function formatGhanaPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `233${cleaned.substring(1)}`;
  }

  if (cleaned.startsWith("233") && cleaned.length === 12) {
    return cleaned;
  }

  if (cleaned.length >= 8 && cleaned.length <= 15) {
    return cleaned;
  }

  throw new Error(
    "Invalid phone number format. Please enter a valid mobile number (e.g., 0241234567 or +233241234567)."
  );
}

export function formatDisplayPhone(formatted: string): string {
  if (formatted.startsWith("233") && formatted.length === 12) {
    return `+233 ${formatted.substring(3, 5)} ${formatted.substring(5, 8)} ${formatted.substring(8)}`;
  }
  return `+${formatted}`;
}

export async function sendPhoneOtp(rawPhone: string): Promise<{
  success: boolean;
  phoneNumber: string;
  displayPhone: string;
  realDispatched: boolean;
  message: string;
  debugOtp?: string;
}> {
  const formattedPhone = formatGhanaPhoneNumber(rawPhone);
  const displayPhone = formatDisplayPhone(formattedPhone);

  // Generate 6-digit numeric OTP code
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(formattedPhone, {
    code: generatedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return {
    success: true,
    phoneNumber: formattedPhone,
    displayPhone,
    realDispatched: false,
    message: `OTP code generated for ${displayPhone}. Demo OTP: ${generatedOtp}`,
    debugOtp: generatedOtp,
  };
}

export async function verifyPhoneOtp(
  rawPhone: string,
  userCode: string
): Promise<boolean> {
  const formattedPhone = formatGhanaPhoneNumber(rawPhone);
  const cleanUserCode = userCode.trim();

  const stored = otpStore.get(formattedPhone);
  if (stored) {
    if (Date.now() <= stored.expiresAt && stored.code === cleanUserCode) {
      otpStore.delete(formattedPhone);
      return true;
    }
  }

  return false;
}

// Backwards-compatibility aliases
export const sendArkeselPhoneOtp = sendPhoneOtp;
export const verifyArkeselPhoneOtp = verifyPhoneOtp;
