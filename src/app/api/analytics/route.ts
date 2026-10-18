import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { TrafficEventModel } from "@/lib/models/TrafficEvent";
import { analyticsScope } from "@/lib/analytics-request";
import { permissionsForRole } from "@/lib/staff-roles";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

/** Which part of the site an event happened on, from its path. */
const SOURCE = {
  $switch: {
    branches: [
      { case: { $eq: ["$path", "/"] }, then: "home" },
      { case: { $regexMatch: { input: "$path", regex: /^\/cars\/[^/]+/ } }, then: "car" },
      { case: { $regexMatch: { input: "$path", regex: /^\/cars(\/|$)/ } }, then: "browse" },
      { case: { $regexMatch: { input: "$path", regex: /^\/blog(\/|$)/ } }, then: "blog" },
      { case: { $regexMatch: { input: "$path", regex: /^\/dealers(\/|$)/ } }, then: "dealers" },
    ],
    default: "other",
  },
};

type Totals = { impressions: number; clicks: number; views: number; visitors: number };

async function totals(match: Record<string, unknown>): Promise<Totals> {
  const [summary] = await TrafficEventModel.aggregate([{ $match: match }, { $facet: {
    kinds: [{ $group: { _id: "$kind", count: { $sum: 1 } } }],
    visitors: [{ $match: { kind: "page_view" } }, { $group: { _id: "$visitor" } }, { $count: "count" }],
  } }]);
  const counts = Object.fromEntries((summary?.kinds || []).map((k: { _id: string; count: number }) => [k._id, k.count]));
  return { impressions: counts.impression || 0, clicks: counts.click || 0, views: counts.page_view || 0, visitors: summary?.visitors[0]?.count || 0 };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || !mongoose.isValidObjectId(user.id)) return NextResponse.json({ error: "Sign in to view analytics." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const requested = Number(params.get("days"));
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const previousStart = new Date(start.getTime() - days * DAY);
  let scope = analyticsScope({ id: user.id, role: user.role }, params.get("scope"));
  // Site-wide numbers are for team roles that can see the dashboard or reports.
  if (!("sellerId" in scope)) {
    const granted = await permissionsForRole(user.role).catch(() => []);
    if (!granted.some((p) => p === "dashboard.view" || p === "reports.view")) scope = { sellerId: user.id };
  }
  // A listing filter narrows the scope; it never widens it, so sellers only ever see their own cars.
  const listing = params.get("listing");
  if (listing !== null && !/^[a-f\d]{24}$/i.test(listing)) return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
  const base = {
    ...("sellerId" in scope ? { sellerId: new mongoose.Types.ObjectId(scope.sellerId) } : {}),
    ...(listing ? { listingId: new mongoose.Types.ObjectId(listing) } : {}),
  };
  const match = { ...base, createdAt: { $gte: start } };
  try {
    await connectToDatabase();
    const [current, previous, daily, dailyVisitors, sources, weekdays, listings] = await Promise.all([
      totals(match),
      totals({ ...base, createdAt: { $gte: previousStart, $lt: start } }),
      TrafficEventModel.aggregate([{ $match: match }, { $group: { _id: { date: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: "UTC" } }, kind: "$kind" }, count: { $sum: 1 } } }]),
      TrafficEventModel.aggregate([{ $match: { ...match, kind: "page_view" } },
        { $group: { _id: { date: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d", timezone: "UTC" } }, visitor: "$visitor" } } },
        { $group: { _id: "$_id.date", count: { $sum: 1 } } }]),
      TrafficEventModel.aggregate([{ $match: { ...match, kind: { $in: ["page_view", "impression"] } } }, { $group: { _id: { source: SOURCE, kind: "$kind" }, count: { $sum: 1 } } }]),
      TrafficEventModel.aggregate([{ $match: { ...match, kind: { $in: ["page_view", "click"] } } }, { $group: { _id: { day: { $isoDayOfWeek: "$createdAt" }, kind: "$kind" }, count: { $sum: 1 } } }]),
      TrafficEventModel.aggregate([{ $match: { ...match, listingId: { $exists: true } } }, { $group: {
        _id: "$listingId", impressions: { $sum: { $cond: [{ $eq: ["$kind", "impression"] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ["$kind", "click"] }, 1, 0] } },
        views: { $sum: { $cond: [{ $eq: ["$kind", "page_view"] }, 1, 0] } },
        visitors: { $addToSet: { $cond: [{ $eq: ["$kind", "page_view"] }, "$visitor", null] } },
      } }, { $sort: { views: -1, impressions: -1 } }, { $limit: 100 },
      { $lookup: { from: "listings", localField: "_id", foreignField: "_id", as: "listing", pipeline: [{ $project: { title: 1, slug: 1, price: 1, status: 1, hasImage: { $gt: [{ $size: { $ifNull: ["$images", []] } }, 0] } } }] } },
      { $project: { impressions: 1, clicks: 1, views: 1, visitors: { $size: { $setDifference: ["$visitors", [null]] } },
        title: { $arrayElemAt: ["$listing.title", 0] }, slug: { $arrayElemAt: ["$listing.slug", 0] }, price: { $arrayElemAt: ["$listing.price", 0] }, status: { $arrayElemAt: ["$listing.status", 0] },
        hasImage: { $arrayElemAt: ["$listing.hasImage", 0] } } }]),
    ]);
    const dates = Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * DAY).toISOString().slice(0, 10));
    const series = (kind: string) => dates.map((date) => ({ date, count: daily.find((r) => r._id.date === date && r._id.kind === kind)?.count || 0 }));
    const sourceCounts = (kind: string) => Object.fromEntries(sources.filter((s) => s._id.kind === kind).map((s) => [s._id.source, s.count]));
    const weekday = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      day,
      views: weekdays.find((w) => w._id.day === day && w._id.kind === "page_view")?.count || 0,
      clicks: weekdays.find((w) => w._id.day === day && w._id.kind === "click")?.count || 0,
    }));
    return NextResponse.json({
      days,
      scope: "sellerId" in scope ? "own" : "site",
      listing: listing || undefined,
      totals: current,
      previous,
      series: {
        impressions: series("impression"), clicks: series("click"), views: series("page_view"),
        visitors: dates.map((date) => ({ date, count: dailyVisitors.find((r) => r._id === date)?.count || 0 })),
      },
      sources: { views: sourceCounts("page_view"), impressions: sourceCounts("impression") },
      weekday,
      // The image route redirects plain URLs and serves inline uploads, so one thumb URL covers both.
      listings: listings.map(({ hasImage, ...l }) => ({ ...l, thumb: hasImage ? `/api/listing-image/${l._id}/0` : undefined })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Traffic report failed", error);
    return NextResponse.json({ error: "Traffic report unavailable. Please try again." }, { status: 503 });
  }
}
