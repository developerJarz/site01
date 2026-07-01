import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";

export const dynamic = "force-dynamic";

// GET — Get all messages for a conversation
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = (session.user as any).id;
    const { id } = await props.params;

    // Verify user is part of this conversation
    const conversation = await Conversation.findById(id).lean() as any;
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isBuyer = conversation.buyer.toString() === userId;
    const isSeller = conversation.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get messages
    const messages = await Message.find({ conversation: id })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages as read for this user
    await Message.updateMany(
      {
        conversation: id,
        sender: { $ne: userId },
        isRead: false,
      },
      { isRead: true }
    );

    // Reset unread counter for this user
    if (isBuyer) {
      await Conversation.findByIdAndUpdate(id, { buyerUnread: 0 });
    } else {
      await Conversation.findByIdAndUpdate(id, { sellerUnread: 0 });
    }

    const formatted = messages.map((m: any) => ({
      _id: m._id.toString(),
      sender: {
        _id: m.sender._id.toString(),
        name: m.sender.name,
        avatar: m.sender.avatar || null,
      },
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ messages: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Send a new message
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = (session.user as any).id;
    const { id } = await props.params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation
    const conversation = await Conversation.findById(id).lean() as any;
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isBuyer = conversation.buyer.toString() === userId;
    const isSeller = conversation.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create the message
    const message = await Message.create({
      conversation: id,
      sender: userId,
      content: content.trim(),
    });

    // Update conversation: lastMessage, lastMessageAt, and increment other party's unread
    const updateFields: any = {
      lastMessage: content.trim().substring(0, 100),
      lastMessageAt: new Date(),
    };

    if (isBuyer) {
      updateFields.$inc = { sellerUnread: 1 };
    } else {
      updateFields.$inc = { buyerUnread: 1 };
    }

    // Separate $inc from $set
    await Conversation.findByIdAndUpdate(id, {
      $set: {
        lastMessage: updateFields.lastMessage,
        lastMessageAt: updateFields.lastMessageAt,
      },
      $inc: updateFields.$inc,
    });

    return NextResponse.json({
      message: {
        _id: message._id.toString(),
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
