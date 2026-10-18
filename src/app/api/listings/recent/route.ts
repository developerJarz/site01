import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { loadRecentListings } from "@/lib/recent-listings";

/** Newest live cars for the homepage's live feed. Shared-cached briefly so polling stays cheap. */
export async function GET() {
  try {
    await connectToDatabase();
    const listings = await loadRecentListings();
    return NextResponse.json({ listings }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch (error) {
    console.error("Recent listings failed", error);
    return NextResponse.json({ error: "Recent listings unavailable." }, { status: 503 });
  }
}
