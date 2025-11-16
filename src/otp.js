// ==== ./src/otp.js ====
import * as otplib from 'otplib';

export function generateOTPCode(secret) {
  return otplib.authenticator.generate(secret);
}
