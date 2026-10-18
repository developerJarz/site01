import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { TrafficEventModel } from "@/lib/models/TrafficEvent";
import { isStaffRole } from "@/lib/permissions";
import { AnalyticsRequestError, parseAnalyticsRequest } from "@/lib/analytics-request";

export async function POST(request: Request) {
  try {
    const payload = await parseAnalyticsRequest(request);
    // Kill switch for local and staging runs that share the production database.
    if (process.env.ANALYTICS_DISABLED === "1") return new Response(null, { status: 204 });
    if (/bot|crawler|spider|headless/i.test(request.headers.get("user-agent") || "")) return new Response(null, { status: 204 });
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (isStaffRole(user?.role)) return new Response(null, { status: 204 });
    await connectToDatabase();
    const ids = payload.events.flatMap((e) => e.listingId ? [e.listingId] : []);
    const slugs = payload.events.filter((e) => e.kind === "page_view" && /^\/cars\/[^/]+$/.test(e.path)).map((e) => decodeURIComponent(e.path.slice(6)));
    const listings = await Listing.find({ status: { $in: ["active", "sold"] }, $or: [{ _id: { $in: ids } }, { slug: { $in: slugs } }] }).select("_id sellerId slug").lean();
    const day = new Date().toISOString().slice(0, 10);
    const hash = (value: string) => createHash("sha256").update(`${process.env.NEXTAUTH_SECRET || "carhat-traffic"}:${value}`).digest("hex");
    const visitor = hash(payload.visitor);
    const operations = payload.events.flatMap((event) => {
      if (/^\/(admin|dashboard|profile|login|register|forgot-password|sell)(\/|$)/.test(event.path)) return [];
      const listing = event.listingId ? listings.find((l) => String(l._id) === event.listingId) : listings.find((l) => `/cars/${encodeURIComponent(l.slug)}` === event.path || `/cars/${l.slug}` === event.path);
      if ((event.listingId && !listing) || (listing && String(listing.sellerId) === user?.id)) return [];
      const key = hash(`${day}:${payload.visitor}:${payload.session}:${event.kind}:${listing?._id || event.path}`);
      return [{ updateOne: { filter: { key }, update: { $setOnInsert: { key, visitor, kind: event.kind, path: event.path, ...(listing ? { listingId: listing._id, sellerId: listing.sellerId } : {}), createdAt: new Date() } }, upsert: true } }];
    });
    if (operations.length) {
      // Unique keys make retries idempotent, including simultaneous tab requests.
      await TrafficEventModel.bulkWrite(operations, { ordered: false }).catch((error) => {
        if (error.code !== 11000 || error.writeErrors?.some((e: { code: number }) => e.code !== 11000)) throw error;
      });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AnalyticsRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Traffic event write failed", error);
    return NextResponse.json({ error: "Tracking unavailable." }, { status: 503 });
  }
}
