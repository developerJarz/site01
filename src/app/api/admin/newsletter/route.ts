import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { requireAdmin } from "@/lib/admin-auth";
import { escapeRegex } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

// GET ?q=&page=1   ·   GET ?all=1 returns every address (for CSV export)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin("newsletter.manage");
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const match = q ? { email: new RegExp(escapeRegex(q.slice(0, 100)), "i") } : {};

    if (sp.get("all") === "1") {
      const all = await NewsletterSubscriber.find(match).sort({ createdAt: -1 }).select("email source createdAt").limit(50_000).lean();
      return NextResponse.json({ subscribers: JSON.parse(JSON.stringify(all)) });
    }

    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = 50;
    const [subscribers, total, totalAll, last7, last30] = await Promise.all([
      NewsletterSubscriber.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      NewsletterSubscriber.countDocuments(match),
      NewsletterSubscriber.estimatedDocumentCount(),
      NewsletterSubscriber.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * DAY) } }),
      NewsletterSubscriber.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * DAY) } }),
    ]);
    return NextResponse.json({
      subscribers: JSON.parse(JSON.stringify(subscribers)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      stats: { total: totalAll, last7, last30 },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE { ids: [] }
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin("newsletter.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => ({}));
    const ids = (Array.isArray(body.ids) ? body.ids : [body.id]).filter((i: unknown) => typeof i === "string" && mongoose.isValidObjectId(i));
    if (!ids.length) return NextResponse.json({ error: "Nothing selected" }, { status: 400 });
    await connectToDatabase();
    const result = await NewsletterSubscriber.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
