import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Listing } from "@/lib/models/Listing";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { Favorite } from "@/lib/models/Favorite";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { ContactMessage } from "@/lib/models/ContactMessage";
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
      const [pendingListings, paperAwaiting, newMessages] = await Promise.all([
        Listing.countDocuments({ status: "pending" }),
        Listing.countDocuments({ paperVerified: { $ne: true }, "documents.0": { $exists: true }, status: { $ne: "removed" } }),
        ContactMessage.countDocuments({ status: "new" }),
      ]);
      return NextResponse.json({ pendingListings, paperAwaiting, newMessages });
    }
    if (!auth.can("dashboard.view")) {
      return NextResponse.json({ error: "Your role doesn't include the dashboard." }, { status: 403 });
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

    // Engagement, geography and pricing for the advanced panels.
    const [
      savesInPeriod,
      soldInPeriod,
      totalSaves,
      subscribers,
      subscribersInPeriod,
      inboxNew,
      chatSeriesRaw,
      cityGroups,
      sellerGroups,
      priceBuckets,
      conditionGroups,
    ] = await Promise.all([
      Favorite.countDocuments({ createdAt: { $gte: since } }),
      Listing.countDocuments({ status: "sold", updatedAt: { $gte: since } }),
      Favorite.estimatedDocumentCount(),
      NewsletterSubscriber.estimatedDocumentCount(),
      NewsletterSubscriber.countDocuments({ createdAt: { $gte: since } }),
      ContactMessage.countDocuments({ status: "new" }),
      Conversation.aggregate(perDay(since)),
      // "Gulshan, Dhaka" → "Dhaka": the last comma-separated part is the city.
      Listing.aggregate([
        { $match: { status: "active", location: { $type: "string", $ne: "" } } },
        { $project: { city: { $trim: { input: { $arrayElemAt: [{ $split: ["$location", ","] }, -1] } } } } },
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Listing.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$sellerId", live: { $sum: 1 }, views: { $sum: "$views" }, value: { $sum: "$price" } } },
        { $sort: { live: -1, views: -1 } },
        { $limit: 6 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } },
        { $project: { live: 1, views: 1, value: 1, name: { $arrayElemAt: ["$u.name", 0] }, dealershipName: { $arrayElemAt: ["$u.dealershipName", 0] }, role: { $arrayElemAt: ["$u.role", 0] } } },
      ]),
      Listing.aggregate([
        { $match: { status: "active" } },
        { $bucket: { groupBy: "$price", boundaries: [0, 1_000_000, 2_000_000, 4_000_000, 10_000_000], default: "top", output: { count: { $sum: 1 } } } },
      ]),
      Listing.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$condition", count: { $sum: 1 } } }]),
    ]);

    const BUCKET_LABEL: Record<string, string> = { "0": "Under 10 lakh", "1000000": "10–20 lakh", "2000000": "20–40 lakh", "4000000": "40 lakh–1 crore", top: "Above 1 crore" };

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
        savesInPeriod,
        soldInPeriod,
        totalSaves,
        subscribers,
        subscribersInPeriod,
        inboxNew,
      },
      series: {
        listings: dailySeries(listingSeriesRaw, days, now),
        users: dailySeries(userSeriesRaw, days, now),
        chats: dailySeries(chatSeriesRaw, days, now),
      },
      cities: cityGroups.filter((c) => c._id).map((c) => ({ city: c._id as string, count: c.count as number })),
      topSellers: JSON.parse(JSON.stringify(sellerGroups)).map((s: any) => ({
        _id: s._id, name: s.dealershipName || s.name || "Deleted account", dealer: s.role === "dealer" || !!s.dealershipName, live: s.live, views: s.views, value: s.value,
      })),
      priceBands: ["0", "1000000", "2000000", "4000000", "top"].map((k) => ({
        key: k, label: BUCKET_LABEL[k], count: (priceBuckets.find((b) => String(b._id) === k)?.count as number) || 0,
      })),
      conditions: conditionGroups.map((c) => ({ condition: String(c._id || "unknown"), count: c.count as number })),
      makes: makeGroups.map((m) => ({ make: m._id || "Other", count: m.count, avgPrice: Math.round(m.avgPrice || 0) })),
      queue: JSON.parse(JSON.stringify(queue.map(withThumb))),
      topViewed: JSON.parse(JSON.stringify(topViewed.map(withThumb))),
      recentUsers: JSON.parse(JSON.stringify(recentUsers)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
