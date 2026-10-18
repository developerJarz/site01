import "server-only";
import { connectToDatabase } from "./db";
import { Listing } from "./models/Listing";
import { BRAND_PAGES, brandSlug } from "./seo-pages";
import { escapeRegex } from "./utils";

export type BrandModelStats = { model: string; count: number; avgPrice: number; minPrice: number; maxPrice: number; minYear: number; maxYear: number };
export type BrandSummary = { make: string; slug: string; count: number; avgPrice: number };

/** Short, evergreen intros for the makes Bangladesh buys most. Other makes get a generic intro. */
export const BRAND_INTROS: Record<string, { models: string[]; intro: string }> = {
  toyota: {
    models: ["Axio", "Allion", "Premio", "Corolla", "Noah", "Harrier", "C-HR", "Land Cruiser Prado"],
    intro: "Toyota is the most popular car brand in Bangladesh. Sedans like the Axio, Allion and Premio are the go-to family cars, the Noah is the favourite microbus for larger families, and the Harrier, C-HR and Prado lead the SUV market. Toyotas keep their value well and parts are easy to find in every district.",
  },
  honda: {
    models: ["Vezel", "Grace", "Fit", "Civic", "CR-V", "Insight"],
    intro: "Honda is best known in Bangladesh for its fuel-saving hybrids. The Vezel compact SUV and the Grace sedan are among the most searched reconditioned cars, while the Civic and CR-V appeal to buyers who want a sportier drive or more space.",
  },
  nissan: {
    models: ["X-Trail", "Sunny", "Note", "Bluebird Sylphy", "Juke", "Kicks"],
    intro: "Nissan offers good-value sedans and SUVs in Bangladesh, from the economical Sunny and Note to the family-sized X-Trail. Used Nissans often cost less than a Toyota of the same age, which makes them worth a look on a budget.",
  },
  mitsubishi: {
    models: ["Pajero", "Outlander", "Lancer", "Attrage", "Eclipse Cross", "Xpander"],
    intro: "Mitsubishi has a long history in Bangladesh, from the rugged Pajero to the Outlander SUV and the economical Attrage sedan. They are popular with buyers who need a tough car for highways and rural roads.",
  },
  hyundai: {
    models: ["Tucson", "Creta", "Elantra", "Santa Fe", "Accent", "i10"],
    intro: "Hyundai cars sold in Bangladesh, such as the Tucson and Creta SUVs and the Elantra sedan, are often bought brand new with a local warranty, so you will find many low-mileage used Hyundais with known service history.",
  },
  suzuki: {
    models: ["Swift", "Alto", "Wagon R", "Ertiga", "Dzire", "Vitara"],
    intro: "Suzuki builds the small, frugal cars that suit Dhaka traffic: the Swift, Alto and Wagon R are among the most affordable cars in Bangladesh, and the seven-seat Ertiga is a budget family favourite.",
  },
  bmw: {
    models: ["3 Series", "5 Series", "X1", "X3", "X5", "7 Series"],
    intro: "BMW is a top choice for luxury car buyers in Bangladesh. The 3 Series and 5 Series sedans and the X1, X3 and X5 SUVs are the most common, both brand new and reconditioned.",
  },
  "mercedes-benz": {
    models: ["C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE"],
    intro: "Mercedes-Benz cars in Bangladesh range from the C-Class and E-Class executive sedans to the flagship S-Class and the GLC and GLE SUVs.",
  },
};

/** The make name as stored on listings for a URL slug, or null when nothing matches. */
export async function resolveBrand(slug: string): Promise<string | null> {
  const known = BRAND_PAGES.find((m) => brandSlug(m) === slug);
  if (known) return known;
  try {
    await connectToDatabase();
    const makes = (await Listing.distinct("make", { status: "active" })) as string[];
    return makes.find((m) => brandSlug(String(m || "")) === slug) || null;
  } catch {
    return null;
  }
}

export const makeFilter = (make: string) => ({ status: "active" as const, make: { $regex: new RegExp(`^\\s*${escapeRegex(make)}\\s*$`, "i") } });

export async function loadBrandModelStats(make: string): Promise<BrandModelStats[]> {
  const rows = await Listing.aggregate([
    { $match: { ...makeFilter(make), price: { $gt: 0 } } },
    {
      $group: {
        _id: { $trim: { input: { $ifNull: ["$model", ""] } } },
        count: { $sum: 1 },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        minYear: { $min: "$year" },
        maxYear: { $max: "$year" },
      },
    },
    { $match: { _id: { $ne: "" } } },
    { $sort: { count: -1 } },
    { $limit: 25 },
  ]);
  return rows.map((r) => ({ model: String(r._id), count: r.count, avgPrice: Math.round(r.avgPrice), minPrice: r.minPrice, maxPrice: r.maxPrice, minYear: r.minYear, maxYear: r.maxYear }));
}

export async function loadBrandSummaries(): Promise<BrandSummary[]> {
  const rows = (await Listing.aggregate([
    { $match: { status: "active", price: { $gt: 0 } } },
    { $group: { _id: { $trim: { input: { $ifNull: ["$make", ""] } } }, count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
    { $match: { _id: { $ne: "" } } },
  ])) as { _id: string; count: number; avgPrice: number }[];
  const bySlug = new Map<string, BrandSummary>();
  for (const r of rows) {
    const slug = brandSlug(r._id);
    const prev = bySlug.get(slug);
    // Merge spellings like "toyota" and "Toyota".
    if (prev) {
      const count = prev.count + r.count;
      bySlug.set(slug, { ...prev, count, avgPrice: Math.round((prev.avgPrice * prev.count + r.avgPrice * r.count) / count) });
    } else bySlug.set(slug, { make: BRAND_PAGES.find((m) => brandSlug(m) === slug) || r._id, slug, count: r.count, avgPrice: Math.round(r.avgPrice) });
  }
  for (const make of BRAND_PAGES) {
    const slug = brandSlug(make);
    if (!bySlug.has(slug)) bySlug.set(slug, { make, slug, count: 0, avgPrice: 0 });
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.make.localeCompare(b.make));
}
