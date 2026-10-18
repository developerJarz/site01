import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import "@/lib/models/User";
import { listingImageUrl } from "@/lib/utils";
import { buildListingQuery } from "@/lib/listing-search";
import { isHotDeal, loadMarketStats } from "@/lib/hot-deals";

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { featured: -1, createdAt: -1 },
  "price-low": { price: 1 },
  "price-high": { price: -1 },
  "year-new": { year: -1 },
  "mileage-low": { mileage: 1 },
  popular: { views: -1 },
};

const PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

export const dynamic = "force-dynamic";

type SellerDoc = { name?: string; role?: string; isVerified?: boolean; dealershipName?: string } | null;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const sort = SORTS[searchParams.get("sort") || "newest"] || SORTS.newest;
    const query = buildListingQuery(searchParams);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("limit")) || PAGE_SIZE));
    const page = Math.max(1, Math.floor(Number(searchParams.get("page")) || 1));
    await connectToDatabase();

    // Only the cover photo: full image arrays can be base64 and several MB per listing.
    const [listings, total, market] = await Promise.all([
      Listing.find(query)
        .select({ documents: 0, description: 0, features: 0, images: { $slice: 1 } })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sellerId", "name role isVerified dealershipName")
        .lean(),
      Listing.countDocuments(query),
      loadMarketStats(),
    ]);

    const formatted = (listings as any[]).map((car) => {
      const seller = car.sellerId as SellerDoc;
      return {
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
        status: car.status,
        images: car.images?.length ? [listingImageUrl(car._id, car.images[0])] : [],
        views: car.views,
        featured: car.featured,
        paperVerified: !!car.paperVerified,
        hotDeal: isHotDeal(market, car),
        seller: seller && typeof seller === "object" && seller.name
          ? { name: seller.name, role: seller.role, isVerified: !!seller.isVerified, dealershipName: seller.dealershipName || undefined }
          : undefined,
      };
    });

    return NextResponse.json({ listings: formatted, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error instanceof RangeError ? 400 : 500 });
  }
}
