import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

const SAFE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"]);

// Serves one listing photo as a normal, cacheable image.
// On hosts without disk storage, uploads are saved as base64 data URIs inside the listing;
// inlining those into HTML/JSON makes every page megabytes heavier and uncacheable.
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string; index: string }> }
) {
  const { id, index } = await props.params;
  const i = Number(index);
  if (!mongoose.isValidObjectId(id) || !Number.isInteger(i) || i < 0 || i > 50) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    await connectToDatabase();
    const doc = await Listing.findById(id).select({ images: { $slice: [i, 1] } }).lean();
    const src = doc?.images?.[0];
    if (!src) return new NextResponse("Not found", { status: 404 });

    if (!src.startsWith("data:")) {
      return NextResponse.redirect(new URL(src, req.url), 308);
    }

    const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(src);
    // Raster formats only: an SVG served from our own origin could run script.
    if (!match || !SAFE_TYPES.has(match[1].toLowerCase())) {
      return new NextResponse("Not found", { status: 404 });
    }
    const body = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]));

    return new NextResponse(body, {
      headers: {
        "Content-Type": match[1],
        "Content-Length": String(body.length),
        // Photos can be replaced by the seller, so cache for a day rather than forever.
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Unavailable", { status: 503 });
  }
}
