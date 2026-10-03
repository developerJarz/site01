import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Listing } from "@/lib/models/Listing";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { requireAdmin } from "@/lib/admin-auth";
import { listingImageUrl } from "@/lib/utils";

const withThumb = <T extends { _id: unknown; thumb?: string }>(r: T) => ({ ...r, thumb: listingImageUrl(r._id, r.thumb) });

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/** Fill a { "YYYY-MM-DD": n } map into a dense array covering every day in the window. */
function dailySeries(rows: { _id: string; count: number }[], days: number, end: Date) {
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(end.getTime() - i * DAY).toISOString().slice(0, 10);
    out.push({ date: key, count: byDay.get(key) || 0 });
  }
  return out;
}

const perDay = (since: Date) => [
  { $match: { createdAt: { $gte: since } } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
      count: { $sum: 1 },
    },
  },
];

// GET ?days=30 (7 | 30 | 90)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();

    // Lightweight counts for the admin sidebar badges.
    if (req.nextUrl.searchParams.get("summary") === "1") {
      const [pendingListings, paperAwaiting] = await Promise.all([
        Listing.countDocuments({ status: "pending" }),
        Listing.countDocuments({ paperVerified: { $ne: true }, "documents.0": { $exists: true }, status: { $ne: "removed" } }),
      ]);
      return NextResponse.json({ pendingListings, paperAwaiting });
    }

    const requested = Number(req.nextUrl.searchParams.get("days"));
    const days = [7, 30, 90].includes(requested) ? requested : 30;
    const now = new Date();
    const since = new Date(now.getTime() - days * DAY);
    const prevSince = new Date(now.getTime() - 2 * days * DAY);

    const [
      totalUsers,
      usersInPeriod,
      usersPrevPeriod,
      statusGroups,
      listingsInPeriod,
      listingsPrevPeriod,
      paperAwaiting,
      valueGroups,
      viewsAgg,
      conversationsInPeriod,
      messagesInPeriod,
      listingSeriesRaw,
      userSeriesRaw,
      makeGroups,
      queue,
      topViewed,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: since } }),
      User.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),
      Listing.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Listing.countDocuments({ createdAt: { $gte: since } }),
      Listing.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),
      Listing.countDocuments({ paperVerified: { $ne: true }, "documents.0": { $exists: true }, status: { $ne: "removed" } }),
      Listing.aggregate([
        { $match: { status: { $in: ["active", "sold"] } } },
        { $group: { _id: "$status", total: { $sum: "$price" }, avg: { $avg: "$price" } } },
      ]),
      Listing.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
      Conversation.countDocuments({ createdAt: { $gte: since } }),
      Message.countDocuments({ createdAt: { $gte: since } }),
      Listing.aggregate(perDay(since)),
      User.aggregate(perDay(since)),
      Listing.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$make", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      // Oldest pending first: that's the order a moderator should work through them.
      Listing.aggregate([
        { $match: { status: "pending" } },
        { $sort: { createdAt: 1 } },
        { $limit: 6 },
        { $lookup: { from: "users", localField: "sellerId", foreignField: "_id", as: "seller" } },
        {
          $project: {
            title: 1, price: 1, slug: 1, createdAt: 1, location: 1, year: 1,
            thumb: { $arrayElemAt: ["$images", 0] },
            docCount: { $size: { $ifNull: ["$documents", []] } },
            sellerName: { $arrayElemAt: ["$seller.name", 0] },
          },
        },
      ]),
      Listing.aggregate([
        { $match: { status: "active" } },
        { $sort: { views: -1 } },
        { $limit: 5 },
        {
          $project: {
            title: 1, price: 1, views: 1, slug: 1,
            thumb: { $arrayElemAt: ["$images", 0] },
          },
        },
      ]),
      User.find().sort({ createdAt: -1 }).limit(6).select("name email role createdAt isVerified").lean(),
    ]);

    const byStatus: Record<string, number> = { active: 0, pending: 0, sold: 0, removed: 0 };
    for (const g of statusGroups) byStatus[g._id] = g.count;
    const value = Object.fromEntries(valueGroups.map((g) => [g._id, { total: g.total, avg: g.avg }]));
    const totalListings = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      days,
      stats: {
        totalUsers,
        totalListings,
        activeListings: byStatus.active,
        pendingListings: byStatus.pending,
        soldListings: byStatus.sold,
        removedListings: byStatus.removed,
        totalViews: viewsAgg[0]?.total || 0,
        paperAwaiting,
        inventoryValue: value.active?.total || 0,
        avgActivePrice: Math.round(value.active?.avg || 0),
        soldValue: value.sold?.total || 0,
        usersInPeriod,
        usersPrevPeriod,
        listingsInPeriod,
        listingsPrevPeriod,
        conversationsInPeriod,
        messagesInPeriod,
      },
      series: {
        listings: dailySeries(listingSeriesRaw, days, now),
        users: dailySeries(userSeriesRaw, days, now),
      },
      makes: makeGroups.map((m) => ({ make: m._id || "Other", count: m.count, avgPrice: Math.round(m.avgPrice || 0) })),
      queue: JSON.parse(JSON.stringify(queue.map(withThumb))),
      topViewed: JSON.parse(JSON.stringify(topViewed.map(withThumb))),
      recentUsers: JSON.parse(JSON.stringify(recentUsers)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
