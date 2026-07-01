import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

// GET all users
export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ users: JSON.parse(JSON.stringify(users)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await connectToDatabase();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update user role
export async function PATCH(req: NextRequest) {
  try {
    const { id, role, isVerified } = await req.json();
    await connectToDatabase();
    const update: any = {};
    if (role !== undefined) update.role = role;
    if (isVerified !== undefined) update.isVerified = isVerified;
    await User.findByIdAndUpdate(id, update);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
