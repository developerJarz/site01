import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { ContactMessage } from "@/lib/models/ContactMessage";
import { requireAdmin } from "@/lib/admin-auth";
import { escapeRegex } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "open", "resolved"] as const;

// GET ?status=new&q=&topic=&page=1
export async function GET(req: NextRequest) {
  const auth = await requireAdmin("inbox.manage");
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = 25;
    const base: Record<string, unknown> = {};
    const q = sp.get("q")?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q.slice(0, 100)), "i");
      base.$or = [{ name: rx }, { email: rx }, { message: rx }, { listing: rx }];
    }
    const topic = sp.get("topic");
    if (topic) base.topic = topic.slice(0, 20);
    const match = { ...base };
    const status = sp.get("status");
    if (status && (STATUSES as readonly string[]).includes(status)) match.status = status;

    const [messages, total, grouped] = await Promise.all([
      ContactMessage.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContactMessage.countDocuments(match),
      ContactMessage.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    const counts: Record<string, number> = { all: 0, new: 0, open: 0, resolved: 0 };
    for (const g of grouped) {
      counts[g._id] = g.count;
      counts.all += g.count;
    }
    return NextResponse.json({ messages: JSON.parse(JSON.stringify(messages)), total, page, pages: Math.max(1, Math.ceil(total / limit)), counts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH { ids: [], status?, note? }
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin("inbox.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => ({}));
    const ids = (Array.isArray(body.ids) ? body.ids : [body.id]).filter((i: unknown) => typeof i === "string" && mongoose.isValidObjectId(i));
    if (!ids.length) return NextResponse.json({ error: "No messages selected" }, { status: 400 });
    const update: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!(STATUSES as readonly string[]).includes(body.status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      update.status = body.status;
    }
    if (typeof body.note === "string") update.note = body.note.slice(0, 2000);
    await connectToDatabase();
    const result = await ContactMessage.updateMany({ _id: { $in: ids } }, { $set: update });
    return NextResponse.json({ success: true, modified: result.modifiedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE { ids: [] }
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin("inbox.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => ({}));
    const ids = (Array.isArray(body.ids) ? body.ids : [body.id]).filter((i: unknown) => typeof i === "string" && mongoose.isValidObjectId(i));
    if (!ids.length) return NextResponse.json({ error: "No messages selected" }, { status: 400 });
    await connectToDatabase();
    const result = await ContactMessage.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
