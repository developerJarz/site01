import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";

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
    const q = searchParams.get("q");

    await connectToDatabase();

    const query: any = { status: "active" };

    if (q) {
      query.$or = [
        { make: { $regex: new RegExp(q, "i") } },
        { model: { $regex: new RegExp(q, "i") } },
        { title: { $regex: new RegExp(q, "i") } },
      ];
    }
    if (make) query.make = { $regex: new RegExp(`^${make}$`, "i") };
    if (condition) query.condition = condition;
    if (fuelType) query.fuelType = fuelType;
    if (transmission) query.transmission = transmission;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
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
      images: car.images,
      featured: car.featured,
    }));

    return NextResponse.json({ listings: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
