import crypto from 'node:crypto';

/**
 * Generates a cryptographically secure numeric One-Time Password (OTP)
 * @param length The length of the OTP (default: 6)
 * @returns A string representation of the numeric OTP
 */
export function generateOtp(length: number = 6): string {
  if (length <= 0) {
    throw new Error('OTP length must be greater than 0');
  }

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);

  const otpNumber = crypto.randomInt(min, max);
  return otpNumber.toString();
}
