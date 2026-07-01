import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, password, role, otpCode } = body;
    const email = body.email?.toLowerCase().trim();

    if (!name || !email || !password || !otpCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify OTP
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json({ error: "OTP expired or not found. Please request a new one." }, { status: 400 });
    }

    if (otpRecord.otpCode !== otpCode) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    // Check if user already exists (just in case)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "buyer",
      isVerified: true, // Mark them as verified
    });

    // Delete the OTP record so it can't be reused
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      { message: "User registered and verified successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}
