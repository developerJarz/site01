import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { consumeOtp } from "@/lib/otp";
import { MIN_PASSWORD, parseOtpCode } from "@/lib/signup";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const otpCode = parseOtpCode(body.otpCode);
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json({ error: "Email, the 6-digit code and a new password are required." }, { status: 400 });
    }
    if (newPassword.length < MIN_PASSWORD || newPassword.length > 128) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters long.` }, { status: 400 });
    }

    await connectToDatabase();

    // Wrong guesses are counted, so a 6-digit code can't be brute-forced.
    const check = await consumeOtp(email, otpCode);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return NextResponse.json({ message: "Password reset successfully. You can now sign in with your new password." }, { status: 200 });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
