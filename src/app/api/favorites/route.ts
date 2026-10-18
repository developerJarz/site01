import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Favorite } from "@/lib/models/Favorite";
import { Listing } from "@/lib/models/Listing";
import { withServedImages } from "@/lib/utils";
import { FavoriteRequestError, parseFavoriteMutation } from "@/lib/favorite-request";

export const dynamic = "force-dynamic";

async function currentUserId() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id && /^[a-f\d]{24}$/i.test(id) ? id : undefined;
}

function failure(error: unknown) {
  if (error instanceof FavoriteRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Saved cars request failed:", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "Could not update saved cars. Please try again." }, { status: 500 });
}

export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Sign in to see your saved cars." }, { status: 401 });
    await connectToDatabase();
    const favorites = await Favorite.find({ userId }).select("listingId").sort({ createdAt: -1 }).lean();
    const ids = favorites.map((favorite) => String(favorite.listingId));
    const cars = await Listing.find({ _id: { $in: ids }, status: { $in: ["active", "sold"] } })
      .select({ title: 1, slug: 1, price: 1, make: 1, model: 1, year: 1, mileage: 1, fuelType: 1,
        transmission: 1, condition: 1, location: 1, featured: 1, paperVerified: 1, status: 1,
        sellerId: 1, images: { $slice: 1 } })
      .populate<{ sellerId: { name: string; role: string; isVerified: boolean; dealershipName?: string } | null }>("sellerId", "name role isVerified dealershipName")
      .lean();
    const byId = new Map(cars.map((car) => [String(car._id), { ...withServedImages(car), seller: car.sellerId }]));
    const listings = ids.flatMap((id) => byId.has(id) ? [byId.get(id)] : []);
    return NextResponse.json({ ids, listings }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Sign in to save a car." }, { status: 401 });
    const listingId = await parseFavoriteMutation(request);
    await connectToDatabase();
    if (!await Listing.exists({ _id: listingId, status: "active" })) {
      return NextResponse.json({ error: "This car is no longer available." }, { status: 404 });
    }
    try {
      await Favorite.updateOne({ userId, listingId }, { $setOnInsert: { userId, listingId } }, { upsert: true });
    } catch (error) {
      // The unique user/listing index also protects simultaneous save requests.
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    }
    return NextResponse.json({ saved: true, listingId });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Sign in to update saved cars." }, { status: 401 });
    const listingId = await parseFavoriteMutation(request);
    await connectToDatabase();
    await Favorite.deleteOne({ userId, listingId });
    return NextResponse.json({ saved: false, listingId });
  } catch (error) { return failure(error); }
}
