import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = (session.user as any).id;

    const listings = await Listing.find({ sellerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
    const activeCount = listings.filter((l) => l.status === "active").length;
    const soldCount = listings.filter((l) => l.status === "sold").length;

    return NextResponse.json({
      listings: JSON.parse(JSON.stringify(listings)),
      stats: {
        total: listings.length,
        active: activeCount,
        sold: soldCount,
        totalViews,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
