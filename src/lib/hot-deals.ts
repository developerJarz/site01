import { Listing } from "@/lib/models/Listing";

/** A car priced at least this far below the average for its make and model is a Hot Deal. */
export const HOT_DEAL_DISCOUNT = 0.1;
/** ...as long as enough comparable listings exist for that average to mean something. */
export const HOT_DEAL_MIN_COMPARABLES = 3;

export type MarketStats = Map<string, { count: number; avgPrice: number }>;

const key = (make?: string, model?: string) => `${make || ""}|${model || ""}`.trim().toLowerCase();

/** Average asking price and listing count for every live make + model. */
export async function loadMarketStats(): Promise<MarketStats> {
  const rows = (await Listing.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: { make: "$make", model: "$model" }, count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
  ])) as { _id: { make?: string; model?: string }; count: number; avgPrice: number }[];
  const market: MarketStats = new Map();
  for (const r of rows) {
    const make = String(r._id.make || "").trim();
    const model = String(r._id.model || "").trim();
    if (make && model) market.set(key(make, model), { count: r.count, avgPrice: r.avgPrice });
  }
  return market;
}

export function isHotDeal(market: MarketStats, car: { make?: string; model?: string; price?: number }) {
  const ref = market.get(key(car.make, car.model));
  const price = Number(car.price) || 0;
  return !!ref && ref.count >= HOT_DEAL_MIN_COMPARABLES && price > 0 && price <= ref.avgPrice * (1 - HOT_DEAL_DISCOUNT);
}
