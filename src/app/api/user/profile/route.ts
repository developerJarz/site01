import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { parseProfileUpdates } from "@/lib/profile";

export const dynamic = "force-dynamic";

/** The profile without the password hash, plus whether one is set (Auth0 accounts have none). */
function toProfile(user: { toObject(): Record<string, unknown> }) {
  const { password, ...profile } = user.toObject();
  return { ...JSON.parse(JSON.stringify(profile)), hasPassword: Boolean(password) };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: toProfile(user) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = req.headers.get("origin");
    if ((origin && origin !== new URL(req.url).origin) || req.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "This request must come from CarHat." }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Send valid profile details." }, { status: 400 });
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const updates = parseProfileUpdates(body, user);
    if (!updates.ok) return NextResponse.json({ error: updates.error }, { status: 400 });
    user.set(updates.value);
    await user.save();
    return NextResponse.json({ user: toProfile(user) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
