import { Otp } from "@/lib/models/Otp";
import { MAX_OTP_ATTEMPTS } from "@/lib/signup";

/**
 * Checks an emailed code. Expired codes are rejected even before the TTL index removes them, and each
 * wrong guess counts: after MAX_OTP_ATTEMPTS the code is deleted so it can't be brute-forced.
 * On success the code is consumed.
 */
export async function consumeOtp(email: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const record = await Otp.findOne({ email });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    if (record) await Otp.deleteOne({ _id: record._id });
    return { ok: false, error: "This code has expired. Request a new one." };
  }
  if (record.otpCode !== code) {
    const attempts = (record.attempts || 0) + 1;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: record._id });
      return { ok: false, error: "Too many wrong codes. Request a new one." };
    }
    await Otp.updateOne({ _id: record._id }, { $set: { attempts } });
    return { ok: false, error: `That code isn't right. ${MAX_OTP_ATTEMPTS - attempts} ${MAX_OTP_ATTEMPTS - attempts === 1 ? "try" : "tries"} left.` };
  }
  await Otp.deleteOne({ _id: record._id });
  return { ok: true };
}
