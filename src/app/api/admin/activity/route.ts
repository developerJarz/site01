import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { ActivityLog } from "@/lib/models/ActivityLog";
import { requireAdmin } from "@/lib/admin-auth";
import { ACTIVITY_AREAS } from "@/lib/activity";
import { escapeRegex } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET ?page=1&limit=30&area=listing&actor=<userId>&q=corolla&days=7  — newest first.
// GET ?all=1 — up to 5,000 matching entries for the CSV export.
// GET ?recent=1 — the latest 8 entries for the dashboard card (any team member who can see the dashboard).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const recent = sp.get("recent") === "1";
  const auth = recent ? await requireAdmin("activity.view", "dashboard.view") : await requireAdmin("activity.view");
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const match: Record<string, unknown> = {};
    // People without the full log only see their own recent actions on the dashboard.
    const selfId = (auth.session.user as { id?: string }).id;
    if (recent && !auth.can("activity.view")) {
      if (!selfId || !mongoose.isValidObjectId(selfId)) return NextResponse.json({ entries: [] });
      match.actorId = new mongoose.Types.ObjectId(selfId);
    }

    const area = sp.get("area");
    if (area && ACTIVITY_AREAS[area]) match.area = area;
    const actor = sp.get("actor");
    if (actor && mongoose.isValidObjectId(actor)) match.actorId = new mongoose.Types.ObjectId(actor);
    const days = Number(sp.get("days"));
    if (Number.isFinite(days) && days > 0) match.createdAt = { $gte: new Date(Date.now() - Math.min(days, 366) * 86400_000) };
    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      match.$or = [{ summary: rx }, { actorName: rx }, { actorEmail: rx }, { targetLabel: rx }];
    }

    if (recent) {
      const entries = await ActivityLog.find(match).sort({ createdAt: -1 }).limit(8).select("-details -ip").lean();
      return NextResponse.json({ entries: JSON.parse(JSON.stringify(entries)) });
    }

    if (sp.get("all") === "1") {
      const entries = await ActivityLog.find(match).sort({ createdAt: -1 }).limit(5000).select("-details").lean();
      return NextResponse.json({ entries: JSON.parse(JSON.stringify(entries)) });
    }

    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(10, Number(sp.get("limit")) || 30));
    const [entries, total, actors] = await Promise.all([
      ActivityLog.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ActivityLog.countDocuments(match),
      // Everyone who has done something, for the "Team member" filter.
      ActivityLog.aggregate([
        { $match: { actorId: { $ne: null } } },
        { $group: { _id: "$actorId", name: { $last: "$actorName" }, email: { $last: "$actorEmail" } } },
        { $sort: { name: 1 } },
        { $limit: 200 },
      ]),
    ]);

    return NextResponse.json({
      entries: JSON.parse(JSON.stringify(entries)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      areas: ACTIVITY_AREAS,
      actors: JSON.parse(JSON.stringify(actors)),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
