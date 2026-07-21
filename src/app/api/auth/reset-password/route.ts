import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { otpCode, newPassword } = body;
    const email = body.email?.toLowerCase().trim();

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP code, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify OTP
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Reset code expired or not found. Please request a new one." },
        { status: 400 }
      );
    }

    if (otpRecord.otpCode !== otpCode) {
      return NextResponse.json(
        { error: "Invalid reset code. Please check and try again." },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash and update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Delete the OTP so it can't be reused
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      { message: "Password reset successfully. You can now sign in with your new password." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
