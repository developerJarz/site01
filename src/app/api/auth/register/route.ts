import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, password, role } = body;
    const email = body.email?.toLowerCase().trim();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTPs for this email to prevent spam/confusion
    await Otp.deleteMany({ email });

    // Create new OTP document (expires in 5 minutes via TTL index)
    await Otp.create({
      email,
      otpCode,
      // Date.now() + 5 minutes
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Send OTP via email (or mock to console)
    await sendOtpEmail(email, otpCode);

    return NextResponse.json(
      { message: "OTP sent successfully", requiresOtp: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
