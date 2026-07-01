import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { Favorite } from "@/lib/models/Favorite";
import { Review } from "@/lib/models/Review";
import { Blog } from "@/lib/models/Blog";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Fetch user profile for completeness check
    const user = await User.findById(userId).select("-password").lean();

    // Calculate profile completeness
    const profileFields = ["name", "email", "phone", "bio", "address", "city", "avatar"];
    const filledFields = profileFields.filter((f) => user && (user as any)[f]);
    const profileCompleteness = Math.round((filledFields.length / profileFields.length) * 100);

    // Fetch user's listings
    const myListings = await Listing.find({ sellerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);
    const activeCount = myListings.filter((l) => l.status === "active").length;
    const soldCount = myListings.filter((l) => l.status === "sold").length;
    const pendingCount = myListings.filter((l) => l.status === "pending").length;

    // Fetch favorites count
    let favoritesCount = 0;
    try {
      favoritesCount = await Favorite.countDocuments({ userId });
    } catch {
      // Favorite model may not have data yet
    }

    // Fetch reviews count
    let reviewsCount = 0;
    try {
      reviewsCount = await Review.countDocuments({ userId });
    } catch {
      // Review model may not have data yet
    }

    // Build recent activity (last 5 listing updates)
    const recentListings = myListings.slice(0, 5).map((l) => ({
      _id: (l as any)._id?.toString(),
      title: l.title,
      slug: l.slug,
      price: l.price,
      status: l.status,
      views: l.views,
      images: l.images,
      condition: l.condition,
      createdAt: (l as any).createdAt,
    }));

    // Admin-specific stats
    let adminStats = null;
    if (userRole === "admin") {
      const [totalUsers, totalListingsAll, totalBlogs] = await Promise.all([
        User.countDocuments(),
        Listing.countDocuments(),
        Blog.countDocuments(),
      ]);
      adminStats = { totalUsers, totalListings: totalListingsAll, totalBlogs };
    }

    return NextResponse.json({
      user: JSON.parse(JSON.stringify(user)),
      profileCompleteness,
      stats: {
        total: myListings.length,
        active: activeCount,
        sold: soldCount,
        pending: pendingCount,
        totalViews,
      },
      favoritesCount,
      reviewsCount,
      recentListings: JSON.parse(JSON.stringify(recentListings)),
      adminStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
