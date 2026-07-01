import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";

export const dynamic = "force-dynamic";

// GET — List all conversations for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = (session.user as any).id;

    const conversations = await Conversation.find({
      $or: [{ buyer: userId }, { seller: userId }],
    })
      .populate("buyer", "name avatar")
      .populate("seller", "name avatar")
      .populate("listing", "title slug images price")
      .sort({ lastMessageAt: -1 })
      .lean();

    const formatted = conversations.map((c: any) => {
      const isBuyer = c.buyer._id.toString() === userId;
      const otherParty = isBuyer ? c.seller : c.buyer;
      const unreadCount = isBuyer ? c.buyerUnread : c.sellerUnread;

      return {
        _id: c._id.toString(),
        otherParty: {
          _id: otherParty._id.toString(),
          name: otherParty.name,
          avatar: otherParty.avatar || null,
        },
        listing: {
          _id: c.listing._id.toString(),
          title: c.listing.title,
          slug: c.listing.slug,
          image: c.listing.images?.[0] || null,
          price: c.listing.price,
        },
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount,
        isBuyer,
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Create or get existing conversation
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = (session.user as any).id;
    const { sellerId, listingId } = await req.json();

    if (!sellerId || !listingId) {
      return NextResponse.json(
        { error: "sellerId and listingId are required" },
        { status: 400 }
      );
    }

    // Prevent chatting with yourself
    if (sellerId === userId) {
      return NextResponse.json(
        { error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    // Upsert: find existing or create new
    const conversation = await Conversation.findOneAndUpdate(
      { buyer: userId, seller: sellerId, listing: listingId },
      {
        $setOnInsert: {
          buyer: userId,
          seller: sellerId,
          listing: listingId,
          lastMessage: "",
          lastMessageAt: new Date(),
          buyerUnread: 0,
          sellerUnread: 0,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      conversationId: conversation._id.toString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
