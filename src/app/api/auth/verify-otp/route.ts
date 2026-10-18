import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { consumeOtp } from "@/lib/otp";
import { parseOtpCode, parseSignup } from "@/lib/signup";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const signup = parseSignup(body);
    if (!signup.ok) return NextResponse.json({ error: signup.error }, { status: 400 });
    const otpCode = parseOtpCode((body as Record<string, unknown>)?.otpCode);
    if (!otpCode) return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });

    const { name, email, password, role, phone, whatsappNumber, whatsappSameAsPhone } = signup.value;
    await connectToDatabase();

    const check = await consumeOtp(email, otpCode);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    // Check if user already exists (just in case)
    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 400 });
    }

    const user = await User.create({
      name,
      email,
      phone,
      whatsappNumber,
      whatsappSameAsPhone,
      password: await bcrypt.hash(password, 10),
      // Only buyer, seller or dealer; admin is granted from the admin panel.
      role,
      // The email address is confirmed by the code.
      isVerified: true,
    });

    return NextResponse.json(
      { message: "User registered and verified successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
