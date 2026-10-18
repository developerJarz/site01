import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("_id").lean();

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: "If this email exists, a reset code has been sent." },
        { status: 200 }
      );
    }

    // One code per 45 seconds, so the form can't be used to flood someone's inbox.
    const recent = await Otp.findOne({ email }).select("createdAt").lean();
    if (recent && Date.now() - new Date(recent.createdAt).getTime() < 45_000) {
      return NextResponse.json({ message: "If this email exists, a reset code has been sent." }, { status: 200 });
    }

    const otpCode = randomInt(100000, 1000000).toString();

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email });

    // Store OTP (expires in 5 minutes via TTL index)
    await Otp.create({
      email,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send the OTP email
    await sendOtpEmail(email, otpCode);

    return NextResponse.json(
      { message: "If this email exists, a reset code has been sent." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
