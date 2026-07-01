import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    await connectToDatabase();

    const results = await Listing.find({
      status: "active",
      $or: [
        { title: { $regex: q, $options: "i" } },
        { make: { $regex: q, $options: "i" } },
        { model: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ],
    })
      .select("title slug price images make model year location")
      .sort({ views: -1 })
      .limit(6)
      .lean();

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
