import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Listing } from "@/lib/models/Listing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    const [totalUsers, totalListings, activeListings, pendingListings, soldListings] =
      await Promise.all([
        User.countDocuments(),
        Listing.countDocuments(),
        Listing.countDocuments({ status: "active" }),
        Listing.countDocuments({ status: "pending" }),
        Listing.countDocuments({ status: "sold" }),
      ]);

    const totalViews = await Listing.aggregate([
      { $group: { _id: null, total: { $sum: "$views" } } },
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt isVerified")
      .lean();

    const recentListings = await Listing.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title price status views slug createdAt")
      .lean();

    const topViewed = await Listing.find({ status: "active" })
      .sort({ views: -1 })
      .limit(5)
      .select("title price views slug")
      .lean();

    return NextResponse.json({
      stats: {
        totalUsers,
        totalListings,
        activeListings,
        pendingListings,
        soldListings,
        totalViews: totalViews[0]?.total || 0,
      },
      recentUsers: JSON.parse(JSON.stringify(recentUsers)),
      recentListings: JSON.parse(JSON.stringify(recentListings)),
      topViewed: JSON.parse(JSON.stringify(topViewed)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
