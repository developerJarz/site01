import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { Conversation } from "@/lib/models/Conversation";
import { Favorite } from "@/lib/models/Favorite";
import { deleteListingsCascade } from "@/lib/cleanup";
import { listingImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function currentUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id || null;
}

/** The seller's own listings with the numbers they care about: views, saves and buyer chats. */
export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Sign in to see your listings." }, { status: 401 });
    await connectToDatabase();

    const listings = await Listing.find({ sellerId: userId })
      .select({ description: 0, features: 0, images: { $slice: 1 }, documents: { $slice: 1 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    const ids = listings.map((l) => l._id);
    const [chats, saves] = await Promise.all([
      Conversation.aggregate([{ $match: { listing: { $in: ids } } }, { $group: { _id: "$listing", count: { $sum: 1 } } }]),
      Favorite.aggregate([{ $match: { listingId: { $in: ids } } }, { $group: { _id: "$listingId", count: { $sum: 1 } } }]),
    ]);
    const chatsBy = new Map(chats.map((c) => [String(c._id), c.count as number]));
    const savesBy = new Map(saves.map((c) => [String(c._id), c.count as number]));

    return NextResponse.json({
      listings: listings.map((l: any) => ({
        _id: String(l._id),
        title: l.title,
        slug: l.slug,
        price: l.price,
        status: l.status,
        views: l.views || 0,
        condition: l.condition,
        location: l.location,
        createdAt: l.createdAt,
        images: l.images?.length ? [listingImageUrl(l._id, l.images[0])] : [],
        paperVerified: !!l.paperVerified,
        hasDocuments: !!l.documents?.length,
        chats: chatsBy.get(String(l._id)) || 0,
        saves: savesBy.get(String(l._id)) || 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH { id, action: "sold" | "relist" | "price", price? }
 * Sellers can mark their car sold, put a sold car back on sale, or change the price. They can't
 * approve their own pending listing or bring back one the team removed.
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Sign in to manage your listings." }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id : "";
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

    await connectToDatabase();
    const listing = await Listing.findOne({ _id: id, sellerId: userId }).select("status price");
    if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

    if (body.action === "sold") {
      if (listing.status !== "active") return NextResponse.json({ error: "Only a live listing can be marked sold." }, { status: 400 });
      listing.status = "sold";
    } else if (body.action === "relist") {
      if (listing.status !== "sold") return NextResponse.json({ error: "Only a sold listing can be put back on sale." }, { status: 400 });
      listing.status = "active";
    } else if (body.action === "price") {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 10_000 || price > 1_000_000_000) {
        return NextResponse.json({ error: "Enter a price between ৳10,000 and ৳100 crore." }, { status: 400 });
      }
      if (listing.status === "removed") return NextResponse.json({ error: "This listing was removed by the CarHat team." }, { status: 400 });
      listing.price = Math.round(price);
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    await listing.save();
    return NextResponse.json({ success: true, status: listing.status, price: listing.price });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** DELETE ?id= — the seller removes their own listing for good, with its saves and chats. */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Sign in to manage your listings." }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

    await connectToDatabase();
    const owned = await Listing.exists({ _id: id, sellerId: userId });
    if (!owned) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    await deleteListingsCascade([id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
