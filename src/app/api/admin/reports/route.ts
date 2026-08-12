import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    // Listings by condition
    const byCondition = await Listing.aggregate([
      { $group: { _id: "$condition", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Listings by fuel type
    const byFuelType = await Listing.aggregate([
      { $group: { _id: "$fuelType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top makes/brands
    const byMake = await Listing.aggregate([
      { $group: { _id: "$make", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Price distribution
    const priceRanges = await Listing.aggregate([
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 1000000, 2000000, 3000000, 5000000, 7000000, 10000000, 20000000],
          default: "20000000+",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Listings by status
    const byStatus = await Listing.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Users by role
    const byRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Monthly registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyListings = await Listing.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Top performing listings
    const topPerforming = await Listing.find({ status: "active" })
      .sort({ views: -1 })
      .limit(5)
      .select("title price views make model year slug")
      .lean();

    return NextResponse.json({
      byCondition,
      byFuelType,
      byMake,
      priceRanges,
      byStatus,
      byRole,
      monthlyUsers,
      monthlyListings,
      topPerforming: JSON.parse(JSON.stringify(topPerforming)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
