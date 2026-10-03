import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { requireAdmin } from "@/lib/admin-auth";
import { escapeRegex, listingImageUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES = ["active", "pending", "sold", "removed"] as const;
const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "price-high": { price: -1 },
  "price-low": { price: 1 },
  views: { views: -1 },
};

// GET — paginated list for the admin table.
//   ?page=1&limit=20&status=pending&q=corolla&papers=awaiting|verified|none&featured=1&sort=newest
// GET ?id=<listingId>&docs=1 — the private paper scans for one listing (loaded only when inspecting).
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const sp = req.nextUrl.searchParams;

    const id = sp.get("id");
    if (id) {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
      }
      const listing = await Listing.findById(id).select("documents images").lean();
      if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      return NextResponse.json({
        documents: listing.documents || [],
        images: sp.get("docs") ? undefined : listing.images || [],
      });
    }

    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(5, Number(sp.get("limit")) || 20));
    const status = sp.get("status");
    const q = sp.get("q")?.trim();
    const papers = sp.get("papers");
    const sort = SORTS[sp.get("sort") || "newest"] || SORTS.newest;

    // Filters shared by the table and the per-status tab counts.
    const base: Record<string, any> = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      base.$or = [{ title: rx }, { make: rx }, { model: rx }, { location: rx }];
    }
    if (sp.get("featured") === "1") base.featured = true;
    if (papers === "verified") base.paperVerified = true;
    if (papers === "awaiting") {
      base.paperVerified = { $ne: true };
      base["documents.0"] = { $exists: true };
    }
    if (papers === "none") base["documents.0"] = { $exists: false };

    const match = { ...base };
    if (status && (STATUSES as readonly string[]).includes(status)) match.status = status;

    const [rows, total, statusCounts] = await Promise.all([
      Listing.aggregate([
        { $match: match },
        { $sort: sort },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "sellerId",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          // Never ship full image/document arrays to the table: on hosts without disk
          // storage these are base64 strings and can run to megabytes per listing.
          $project: {
            title: 1, slug: 1, description: 1, price: 1, condition: 1, make: 1, model: 1,
            year: 1, mileage: 1, fuelType: 1, transmission: 1, engineSize: 1, color: 1,
            location: 1, views: 1, status: 1, featured: 1, paperVerified: 1,
            paperVerifiedAt: 1, paperVerificationNote: 1, features: 1, createdAt: 1,
            thumb: { $arrayElemAt: ["$images", 0] },
            imageCount: { $size: { $ifNull: ["$images", []] } },
            docCount: { $size: { $ifNull: ["$documents", []] } },
            sellerId: {
              _id: { $arrayElemAt: ["$seller._id", 0] },
              name: { $arrayElemAt: ["$seller.name", 0] },
              email: { $arrayElemAt: ["$seller.email", 0] },
              role: { $arrayElemAt: ["$seller.role", 0] },
              phone: { $arrayElemAt: ["$seller.phone", 0] },
            },
          },
        },
      ]),
      Listing.countDocuments(match),
      Listing.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = { all: 0 };
    for (const s of STATUSES) counts[s] = 0;
    for (const c of statusCounts) {
      counts[c._id] = c.count;
      counts.all += c.count;
    }

    return NextResponse.json({
      listings: JSON.parse(JSON.stringify(rows.map((r) => ({ ...r, thumb: listingImageUrl(r._id, r.thumb) })))),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      counts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const EDITABLE_FIELDS = [
  "title", "description", "price", "condition", "make", "model",
  "year", "mileage", "fuelType", "transmission", "engineSize",
  "color", "location", "status", "featured", "images", "features",
  "documents", "paperVerified", "paperVerifiedAt", "paperVerificationNote",
];

// Fields that may be changed on many listings at once from the bulk bar.
const BULK_FIELDS = ["status", "featured", "paperVerified", "paperVerifiedAt"];

// PATCH — edit one listing ({ id, ...fields }) or bulk-update ({ ids: [], ...fields }).
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    await connectToDatabase();

    if (Array.isArray(body.ids)) {
      const ids = body.ids.filter((i: unknown) => typeof i === "string" && mongoose.isValidObjectId(i));
      if (ids.length === 0) {
        return NextResponse.json({ error: "No listings selected" }, { status: 400 });
      }
      const update: Record<string, unknown> = {};
      for (const field of BULK_FIELDS) {
        if (body[field] !== undefined) update[field] = body[field];
      }
      if (update.status && !(STATUSES as readonly string[]).includes(update.status as string)) {
        return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      }
      const result = await Listing.updateMany({ _id: { $in: ids } }, { $set: update });
      return NextResponse.json({ success: true, modified: result.modifiedCount });
    }

    const id = body.id || body._id;
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Missing listing ID" }, { status: 400 });
    }

    const update: Record<string, any> = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    // Only regenerate the slug when the title actually changes, so existing links keep working.
    if (update.title) {
      const current = await Listing.findById(id).select("title").lean();
      if (current && current.title !== update.title) {
        update.slug =
          update.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          Date.now().toString(36);
      }
    }

    const updated = await Listing.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, strict: false, projection: { images: 0, documents: 0 } }
    ).lean();

    return NextResponse.json({ success: true, listing: JSON.parse(JSON.stringify(updated)) });
  } catch (error: any) {
    console.error("Admin PATCH listing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — { id } or { ids: [] }
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id, ids } = await req.json();
    await connectToDatabase();
    const targets: string[] = (Array.isArray(ids) ? ids : [id]).filter(
      (i: unknown) => typeof i === "string" && mongoose.isValidObjectId(i)
    );
    if (targets.length === 0) {
      return NextResponse.json({ error: "No listings selected" }, { status: 400 });
    }
    const result = await Listing.deleteMany({ _id: { $in: targets } });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
