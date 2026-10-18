import { Listing } from "@/lib/models/Listing";
import { withServedImages } from "@/lib/utils";

export type RecentListing = {
  _id: string; title: string; slug: string; price: number; make?: string; model?: string; year?: number;
  location?: string; paperVerified?: boolean; createdAt: string; images?: string[];
};

const RECENT_FIELDS = {
  title: 1, slug: 1, price: 1, make: 1, model: 1, year: 1, location: 1, paperVerified: 1, createdAt: 1,
  images: { $slice: 1 },
};

/** Newest live cars, for the homepage's live feed. Caller connects to the database first. */
export async function loadRecentListings(limit = 12): Promise<RecentListing[]> {
  const docs = await Listing.find({ status: "active" }).select(RECENT_FIELDS).sort({ createdAt: -1 }).limit(limit).lean();
  return JSON.parse(JSON.stringify(docs.map((doc) => withServedImages(doc as typeof doc & { _id: unknown; images?: string[] }))));
}
