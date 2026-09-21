import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

export const dynamic = "force-dynamic";

// GET all listings
export async function GET() {
  try {
    await connectToDatabase();
    const listings = await Listing.find()
      .populate("sellerId", "name email role")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ listings: JSON.parse(JSON.stringify(listings)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update listing (supports all fields for admin editing)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json({ error: "Missing listing ID" }, { status: 400 });
    }
    
    await connectToDatabase();

    // Build update object from all provided fields
    const allowedFields = [
      "title", "description", "price", "condition", "make", "model",
      "year", "mileage", "fuelType", "transmission", "engineSize",
      "color", "location", "status", "featured", "images", "features",
      "documents", "paperVerified", "paperVerifiedAt", "paperVerificationNote",
    ];

    const update: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    // If title changed, regenerate slug
    if (update.title) {
      update.slug =
        update.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString(36);
    }

    const updated = await Listing.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, strict: false }
    );

    return NextResponse.json({ success: true, listing: JSON.parse(JSON.stringify(updated)) });
  } catch (error: any) {
    console.error("Admin PATCH listing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a listing
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await connectToDatabase();
    await Listing.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
