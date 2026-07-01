import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await connectToDatabase();
    
    // Find conversations where the user is either buyer or seller and has unread messages
    const unreadConversations = await Conversation.find({
      $or: [
        { buyer: userId, buyerUnread: { $gt: 0 } },
        { seller: userId, sellerUnread: { $gt: 0 } }
      ]
    });

    let totalUnread = 0;
    for (const conv of unreadConversations) {
      if (conv.buyer.toString() === userId) {
        totalUnread += conv.buyerUnread;
      } else if (conv.seller.toString() === userId) {
        totalUnread += conv.sellerUnread;
      }
    }

    return NextResponse.json({ unreadCount: totalUnread }, { status: 200 });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
