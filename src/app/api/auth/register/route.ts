import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendOtpEmail } from "@/lib/email";
import { parseSignup } from "@/lib/signup";

/** Minimum gap between two codes for the same address, so the form can't be used to spam an inbox. */
const RESEND_AFTER_MS = 45_000;

export async function POST(req: Request) {
  try {
    const signup = parseSignup(await req.json().catch(() => null));
    if (!signup.ok) return NextResponse.json({ error: signup.error }, { status: 400 });
    const { email } = signup.value;

    await connectToDatabase();

    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 400 });
    }

    const recent = await Otp.findOne({ email }).select("createdAt").lean();
    if (recent && Date.now() - new Date(recent.createdAt).getTime() < RESEND_AFTER_MS) {
      return NextResponse.json({ error: "We just sent you a code. Wait a moment before asking for another." }, { status: 429 });
    }

    const otpCode = randomInt(100000, 1000000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otpCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });

    // Send OTP via email (or mock to console)
    await sendOtpEmail(email, otpCode);

    return NextResponse.json({ message: "OTP sent successfully", requiresOtp: true }, { status: 200 });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
