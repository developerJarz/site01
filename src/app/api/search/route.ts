import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { escapeRegex, withServedImages } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 60);

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    await connectToDatabase();

    const rx = new RegExp(escapeRegex(q), "i");
    const results = await Listing.find({
      status: "active",
      $or: [
        { title: rx },
        { make: rx },
        { model: rx },
        { location: rx },
      ],
    })
      .select({ title: 1, slug: 1, price: 1, make: 1, model: 1, year: 1, location: 1, images: { $slice: 1 } })
      .sort({ views: -1 })
      .limit(6)
      .lean();

    return NextResponse.json({ results: results.map(withServedImages) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
