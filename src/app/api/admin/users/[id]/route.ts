import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Listing } from "@/lib/models/Listing";
import { Favorite } from "@/lib/models/Favorite";
import { Conversation } from "@/lib/models/Conversation";
import { requireAdmin } from "@/lib/admin-auth";
import { listingImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** GET — one account with its listings and activity, for the admin user drawer. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin("users.view");
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid account." }, { status: 400 });
    await connectToDatabase();
    const user = await User.findById(id)
      .select("-password -avatarPublicId +adminNotes")
      .lean();
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const oid = new mongoose.Types.ObjectId(id);
    const [listings, statusGroups, saves, chatsAsBuyer, chatsAsSeller] = await Promise.all([
      Listing.find({ sellerId: oid })
        .select({ title: 1, slug: 1, price: 1, status: 1, views: 1, createdAt: 1, paperVerified: 1, images: { $slice: 1 } })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
      Listing.aggregate([{ $match: { sellerId: oid } }, { $group: { _id: "$status", count: { $sum: 1 }, views: { $sum: "$views" } } }]),
      Favorite.countDocuments({ userId: oid }),
      Conversation.countDocuments({ buyer: oid }),
      Conversation.countDocuments({ seller: oid }),
    ]);

    const byStatus = Object.fromEntries(statusGroups.map((g: { _id: string; count: number }) => [g._id, g.count]));
    return NextResponse.json({
      user: JSON.parse(JSON.stringify(user)),
      listings: JSON.parse(JSON.stringify(listings.map(({ images, ...l }) => ({ ...l, thumb: listingImageUrl(l._id, images?.[0]) })))),
      activity: {
        listings: statusGroups.reduce((n: number, g: { count: number }) => n + g.count, 0),
        live: byStatus.active || 0,
        pending: byStatus.pending || 0,
        sold: byStatus.sold || 0,
        views: statusGroups.reduce((n: number, g: { views: number }) => n + (g.views || 0), 0),
        saves,
        chatsAsBuyer,
        chatsAsSeller,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
