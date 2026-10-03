import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin } from "@/lib/admin-auth";
import { escapeRegex } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLES = ["guest", "buyer", "seller", "dealer", "admin"];

// GET ?page=1&limit=25&q=rahim&role=dealer&verified=1|0
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(200, Math.max(5, Number(sp.get("limit")) || 25));
    const q = sp.get("q")?.trim();
    const role = sp.get("role");
    const verified = sp.get("verified");

    const base: Record<string, any> = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      base.$or = [{ name: rx }, { email: rx }, { phone: rx }, { dealershipName: rx }];
    }
    if (verified === "1") base.isVerified = true;
    if (verified === "0") base.isVerified = { $ne: true };

    const match = { ...base };
    if (role && ROLES.includes(role)) match.role = role;

    const [users, total, roleCounts] = await Promise.all([
      User.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "listings",
            let: { uid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$sellerId", "$$uid"] } } },
              { $project: { status: 1 } },
            ],
            as: "listings",
          },
        },
        {
          $project: {
            name: 1, email: 1, phone: 1, role: 1, isVerified: 1, city: 1,
            dealershipName: 1, createdAt: 1,
            listingCount: { $size: "$listings" },
            activeCount: {
              $size: { $filter: { input: "$listings", cond: { $eq: ["$$this.status", "active"] } } },
            },
          },
        },
      ]),
      User.countDocuments(match),
      User.aggregate([{ $match: base }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = { all: 0 };
    for (const r of ROLES) counts[r] = 0;
    for (const c of roleCounts) {
      counts[c._id] = c.count;
      counts.all += c.count;
    }

    return NextResponse.json({
      users: JSON.parse(JSON.stringify(users)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      counts,
      currentUserId: (auth.session.user as { id?: string }).id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function targetIds(body: { id?: unknown; ids?: unknown }): string[] {
  const list = Array.isArray(body.ids) ? body.ids : [body.id];
  return list.filter((i): i is string => typeof i === "string" && mongoose.isValidObjectId(i));
}

// DELETE { id } or { ids: [] }
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const ids = targetIds(await req.json());
    const selfId = (auth.session.user as { id?: string }).id;
    if (ids.length === 0) return NextResponse.json({ error: "No users selected" }, { status: 400 });
    if (selfId && ids.includes(selfId)) {
      return NextResponse.json({ error: "You can't delete your own account from here." }, { status: 400 });
    }
    await connectToDatabase();
    const result = await User.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH { id | ids, role?, isVerified? }
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const ids = targetIds(body);
    const selfId = (auth.session.user as { id?: string }).id;
    if (ids.length === 0) return NextResponse.json({ error: "No users selected" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (body.role !== undefined) {
      if (!ROLES.includes(body.role)) {
        return NextResponse.json({ error: "Unknown role" }, { status: 400 });
      }
      if (selfId && ids.includes(selfId) && body.role !== "admin") {
        return NextResponse.json({ error: "You can't remove your own admin role." }, { status: 400 });
      }
      update.role = body.role;
    }
    if (body.isVerified !== undefined) update.isVerified = !!body.isVerified;

    await connectToDatabase();
    const result = await User.updateMany({ _id: { $in: ids } }, { $set: update });
    return NextResponse.json({ success: true, modified: result.modifiedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
