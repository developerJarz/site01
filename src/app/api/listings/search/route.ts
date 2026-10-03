import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { escapeRegex, listingImageUrl } from "@/lib/utils";

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { featured: -1, createdAt: -1 },
  "price-low": { price: 1 },
  "price-high": { price: -1 },
  "year-new": { year: -1 },
  "mileage-low": { mileage: 1 },
  popular: { views: -1 },
};

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const make = searchParams.get("make");
    const condition = searchParams.get("condition");
    const fuelType = searchParams.get("fuelType");
    const transmission = searchParams.get("transmission");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const q = searchParams.get("q")?.trim();
    const location = searchParams.get("location")?.trim();
    const verified = searchParams.get("verified");
    const sort = SORTS[searchParams.get("sort") || "newest"] || SORTS.newest;

    await connectToDatabase();

    const query: any = { status: "active" };

    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      query.$or = [{ make: rx }, { model: rx }, { title: rx }, { location: rx }];
    }
    if (make) query.make = { $regex: new RegExp(`^${escapeRegex(make)}$`, "i") };
    if (location) query.location = { $regex: new RegExp(escapeRegex(location), "i") };
    if (verified === "1") query.paperVerified = true;
    if (condition) query.condition = condition;
    if (fuelType) query.fuelType = fuelType;
    if (transmission) query.transmission = transmission;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Only the cover photo: full image arrays can be base64 and several MB per listing.
    const listings = await Listing.find(query)
      .select({ documents: 0, description: 0, features: 0, images: { $slice: 1 } })
      .sort(sort)
      .limit(120)
      .lean();

    const formatted = (listings as any[]).map((car) => ({
      _id: car._id.toString(),
      title: car.title,
      slug: car.slug,
      price: car.price,
      condition: car.condition,
      make: car.make,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
      fuelType: car.fuelType,
      transmission: car.transmission,
      location: car.location,
      images: car.images?.length ? [listingImageUrl(car._id, car.images[0])] : [],
      views: car.views,
      featured: car.featured,
      paperVerified: !!car.paperVerified,
    }));

    return NextResponse.json({ listings: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
