/**
 * NSS DirectStay Ghana - Native Arkesel v2 OTP API Integration Module (Client side helper)
 */

export function formatGhanaPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `233${cleaned.substring(1)}`;
  }
  
  if (cleaned.startsWith("233") && cleaned.length === 12) {
    return cleaned;
  }

  if (phone.startsWith("+233") && cleaned.length === 12) {
    return cleaned;
  }

  if (cleaned.length >= 8 && cleaned.length <= 15) {
    return cleaned;
  }

  throw new Error("Invalid Ghanaian phone number format. Please enter a valid number (e.g., 0241234567).");
}
