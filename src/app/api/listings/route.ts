import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { SiteSettings } from "@/lib/models/SiteSettings";
import { User } from "@/lib/models/User";
import { parseListingInput } from "@/lib/listing-input";
import { isStaffRole } from "@/lib/permissions";
import { escapeRegex } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to post a car." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Send the listing details." }, { status: 400 });
    await connectToDatabase();

    // The admin's listing rules (Admin → Settings) decide the photo cap and whether new cars wait for review.
    const settings = await SiteSettings.findOne().select("autoApproveListings defaultListingStatus maxImagesPerListing").lean();
    const parsed = parseListingInput(body, { maxImages: settings?.maxImagesPerListing || 10 });
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const input = parsed.value;
    const userId = (session.user as { id?: string }).id;
    const isAdmin = isStaffRole((session.user as { role?: string }).role);
    // Live straight away when the site default says so, or for verified sellers when auto-approve is on.
    const verifiedSeller = settings?.autoApproveListings ? !!(await User.exists({ _id: userId, isVerified: true })) : false;
    const status = isAdmin || settings?.defaultListingStatus === "active" || verifiedSeller ? "active" : "pending";
    const title = `${input.year} ${input.make} ${input.model}`;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

    const listing = await Listing.create({
      ...input,
      title,
      slug,
      sellerId: userId,
      status,
      featured: false,
      paperVerified: false,
      views: 0,
    });

    return NextResponse.json({ success: true, status, listing: { _id: listing._id, slug: listing.slug, status } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const make = searchParams.get("make");
    const location = searchParams.get("location");

    const query: any = { status: "active" };
    if (make) query.make = { $regex: new RegExp(`^${escapeRegex(make)}$`, "i") };
    if (location) query.location = { $regex: escapeRegex(location), $options: "i" };

    await connectToDatabase();
    const listings = await Listing.find(query)
      .select("-documents")
      .sort({ createdAt: -1 })
      .limit(50);
    return NextResponse.json({ listings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
