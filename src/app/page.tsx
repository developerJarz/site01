import { Fragment } from "react";
import { connectToDatabase } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import type { HomeSectionKey } from "@/lib/site-config";
import { Listing } from "@/lib/models/Listing";
import { buildListingQuery } from "@/lib/listing-search";
import { cn, withServedImages } from "@/lib/utils";
import { HOT_DEAL_DISCOUNT, HOT_DEAL_MIN_COMPARABLES, isHotDeal, type MarketStats } from "@/lib/hot-deals";
import { loadRecentListings, type RecentListing } from "@/lib/recent-listings";
import type { CarCardData } from "@/components/CarCard";
import { BRANDS, CATEGORIES, MORE_MAKES } from "@/components/home/data";
import { HeroSection } from "@/components/home/HeroSection";
import { SmartSearch } from "@/components/home/SmartSearch";
import { TrustStats } from "@/components/home/TrustStats";
import { PopularBrands } from "@/components/home/PopularBrands";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedCars } from "@/components/home/FeaturedCars";
import { RecentlyListedCars } from "@/components/home/RecentlyListedCars";
import { SellBanner } from "@/components/home/SellBanner";
import { WhyChoose } from "@/components/home/WhyChoose";
import { HowItWorks } from "@/components/home/HowItWorks";
import { AiAssistant } from "@/components/home/AiAssistant";
import { Reviews } from "@/components/home/Reviews";
import { AppPromo } from "@/components/home/AppPromo";
import { MotionRoot } from "@/components/ui/motion";
import { HomeSeoContent, type ModelPrice } from "@/components/home/HomeSeoContent";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { BodyTypeShowcase, BudgetPicks, HotDealsRail, LuxuryBento, type ShowcaseCar } from "@/components/home/Showcases";

// Rebuilt at most once a minute instead of on every request.
export const revalidate = 60;

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/");

const CARD_FIELDS = {
  title: 1, slug: 1, price: 1, make: 1, model: 1, year: 1, mileage: 1, fuelType: 1, transmission: 1,
  condition: 1, location: 1, featured: 1, paperVerified: 1, status: 1, createdAt: 1, sellerId: 1,
  color: 1, images: { $slice: 1 }, imageAlts: { $slice: 1 },
};
const SELLER_FIELDS = "name role isVerified dealershipName";

/** Body styles offered as tabs in the showcase, in this order. Keys match buildListingQuery categories. */
const BODY_TABS = [
  { key: "suv", label: "SUV" }, { key: "sedan", label: "Sedan" }, { key: "hatchback", label: "Hatchback" },
  { key: "hybrid", label: "Hybrid" }, { key: "mpv", label: "MPV" },
];
const BUDGET_MAX = 1_500_000;

/** Sections with a full-width background colour. */
const BANDS = new Set<HomeSectionKey>(["recent", "bodyTypes", "luxury", "categories", "howItWorks", "aiAssistant", "seoContent"]);
/** Sections without top / bottom padding of their own. */
const OPEN_TOP = new Set<HomeSectionKey>(["sellBanner", "appPromo"]);
const OPEN_BOTTOM = new Set<HomeSectionKey>(["sellBanner", "trustStats"]);

// Bucket boundaries as /cars filters them, keyed like BUDGETS.
const BUDGET_BUCKETS: Record<string, string> = {
  "0": "0-1000000", "1000000": "1000000-2000000", "2000000": "2000000-4000000", "4000000": "4000000-10000000", top: "10000000-",
};

type SellerDoc = { name: string; role?: string; isVerified?: boolean; dealershipName?: string } | null;
type CarDoc = Record<string, unknown> & { _id: unknown; images?: string[]; sellerId?: SellerDoc };

function toCards(docs: CarDoc[]): CarCardData[] {
  return JSON.parse(JSON.stringify(docs.map(({ sellerId, ...car }) => ({
    ...withServedImages(car),
    seller: sellerId && typeof sellerId === "object" ? sellerId : undefined,
  }))));
}

import mongoose from "mongoose";
import type { AppearanceSettings } from "@/lib/site-config";

async function getHomeData(appearance?: AppearanceSettings) {
  try {
    await connectToDatabase();
    const active = { status: "active" as const };

    // Section configs
    const recentCfg = appearance?.sectionConfigs?.recent;
    const recentLimit = recentCfg?.carLimit && recentCfg.carLimit > 0 ? recentCfg.carLimit : 8;
    const recentSort: Record<string, 1 | -1> = recentCfg?.carSort === "price-asc" ? { price: 1, _id: -1 }
      : recentCfg?.carSort === "price-desc" ? { price: -1, _id: -1 }
      : recentCfg?.carSort === "popular" ? { views: -1, _id: -1 }
      : { createdAt: -1, _id: -1 };

    const featCfg = appearance?.sectionConfigs?.featured;
    const featLimit = featCfg?.carLimit && featCfg.carLimit > 0 ? featCfg.carLimit : 8;

    const budgetCfg = appearance?.sectionConfigs?.budget;
    const budgetMax = budgetCfg?.priceThreshold && budgetCfg.priceThreshold > 0 ? budgetCfg.priceThreshold : BUDGET_MAX;
    const budgetLimit = budgetCfg?.carLimit && budgetCfg.carLimit > 0 ? budgetCfg.carLimit : 6;

    const luxuryCfg = appearance?.sectionConfigs?.luxury;
    const luxuryMin = luxuryCfg?.priceThreshold && luxuryCfg.priceThreshold > 0 ? luxuryCfg.priceThreshold : 4_000_000;
    const luxuryLimit = luxuryCfg?.carLimit && luxuryCfg.carLimit > 0 ? luxuryCfg.carLimit : 5;

    const bodyLimit = appearance?.sectionConfigs?.bodyTypes?.carLimit || 4;
    const dealsCfg = appearance?.sectionConfigs?.hotDeals;
    const minDiscount = dealsCfg?.priceThreshold ? dealsCfg.priceThreshold / 100 : HOT_DEAL_DISCOUNT;
    const dealsLimit = dealsCfg?.carLimit && dealsCfg.carLimit > 0 ? dealsCfg.carLimit : 10;

    // Featured cars custom filter or popular
    const getFeaturedQuery = () => {
      if (featCfg?.carFilterMode === "verified") {
        return Listing.find({ ...active, paperVerified: true }).select(CARD_FIELDS).sort({ featured: -1, views: -1 }).limit(featLimit).populate("sellerId", SELLER_FIELDS).lean();
      }
      if (featCfg?.carFilterMode === "handpicked" && featCfg.handpickedIds?.length) {
        const objIds = featCfg.handpickedIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
        const slugs = featCfg.handpickedIds;
        return Listing.find({ ...active, $or: [{ _id: { $in: objIds } }, { slug: { $in: slugs } }] })
          .select(CARD_FIELDS).limit(featLimit).populate("sellerId", SELLER_FIELDS).lean();
      }
      return Listing.find(active).select(CARD_FIELDS).sort({ featured: -1, views: -1 }).limit(featLimit).populate("sellerId", SELLER_FIELDS).lean();
    };

    const [recent, latest, popular, verified, activeCount, verifiedCount, makes, budgets, models, categoryCounts] = await Promise.all([
      loadRecentListings(12),
      Listing.find(active).select(CARD_FIELDS).sort(recentSort).limit(recentLimit).populate("sellerId", SELLER_FIELDS).lean(),
      getFeaturedQuery(),
      Listing.find({ ...active, paperVerified: true }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(1).populate("sellerId", SELLER_FIELDS).lean(),
      Listing.countDocuments(active),
      Listing.countDocuments({ ...active, paperVerified: true }),
      Listing.aggregate([{ $match: active }, { $group: { _id: "$make", count: { $sum: 1 } } }]),
      Listing.aggregate([
        { $match: active },
        { $bucket: { groupBy: "$price", boundaries: [0, 1_000_000, 2_000_000, 4_000_000, 10_000_000], default: "top", output: { count: { $sum: 1 } } } },
      ]),
      Listing.aggregate([
        { $match: active },
        { $group: { _id: { make: "$make", model: "$model" }, count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
        { $sort: { count: -1 } },
      ]),
      Promise.all(CATEGORIES.map((c) => Listing.countDocuments(buildListingQuery(new URLSearchParams({ category: c.key }))))),
    ]);

    const [bodyGroups, dealPool, luxury, budget] = await Promise.all([
      Promise.all(BODY_TABS.map((t) => Listing.find(buildListingQuery(new URLSearchParams({ category: t.key })))
        .select(CARD_FIELDS).sort({ createdAt: -1 }).limit(bodyLimit).lean())),
      Listing.find(active).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(150).lean(),
      Listing.find({ ...active, ...buildListingQuery(new URLSearchParams({ category: "luxury" })), price: { $gte: luxuryMin } })
        .select(CARD_FIELDS).sort({ price: -1 }).limit(luxuryLimit).lean(),
      Listing.find({ ...active, price: { $gt: 0, $lte: budgetMax } }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(budgetLimit).lean(),
    ]);

    const market: MarketStats = new Map();
    const modelsByMake: Record<string, string[]> = {};
    const topModels: ModelPrice[] = [];
    for (const m of models as { _id: { make?: string; model?: string }; count: number; avgPrice: number }[]) {
      const make = String(m._id.make || "").trim();
      const model = String(m._id.model || "").trim();
      if (!make || !model) continue;
      if (topModels.length < 10 && m.avgPrice > 0) topModels.push({ make, model, count: m.count, avgPrice: Math.round(m.avgPrice) });
      market.set(`${make}|${model}`.toLowerCase(), m);
      (modelsByMake[make.toLowerCase()] ??= []).push(model);
    }
    const withDeals = (cars: CarCardData[]): CarCardData[] => cars.map((car) => ({ ...car, hotDeal: isHotDeal(market, car) }));

    // Hot deals: ranked by how far below the model average they sit.
    const deals: ShowcaseCar[] = toCards(dealPool as unknown as CarDoc[]).flatMap((car) => {
      const ref = market.get(`${String(car.make || "").trim()}|${String(car.model || "").trim()}`.toLowerCase());
      if (!ref || ref.count < HOT_DEAL_MIN_COMPARABLES || !(car.price > 0)) return [];
      const discount = 1 - car.price / ref.avgPrice;
      return discount >= minDiscount ? [{ ...car, hotDeal: true, discount, marketAvg: Math.round(ref.avgPrice) }] : [];
    }).sort((a, b) => (b.discount || 0) - (a.discount || 0)).slice(0, dealsLimit);

    const dbMakes = (makes as { _id: unknown }[]).map((m) => String(m._id || "").trim()).filter(Boolean);
    const seen = new Set<string>();
    const makeOptions = [...BRANDS.map((b) => b.name), ...MORE_MAKES, ...dbMakes]
      .filter((m) => !seen.has(m.toLowerCase()) && seen.add(m.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    return {
      recent,
      topModels,
      latest: withDeals(toCards(latest as unknown as CarDoc[])),
      bodyGroups: BODY_TABS.map((t, i) => ({ ...t, cars: toCards(bodyGroups[i] as unknown as CarDoc[]) as ShowcaseCar[] })),
      deals,
      luxury: toCards(luxury as unknown as CarDoc[]) as ShowcaseCar[],
      budget: toCards(budget as unknown as CarDoc[]) as ShowcaseCar[],
      budgetMax,
      featured: withDeals(toCards(popular as unknown as CarDoc[])),
      verifiedCar: withDeals(toCards(verified as unknown as CarDoc[]))[0],
      activeCount,
      verifiedCount,
      makeOptions,
      modelsByMake,
      makeCounts: Object.fromEntries((makes as { _id: unknown; count: number }[]).map((m) => [String(m._id).toLowerCase(), m.count])),
      budgetCounts: Object.fromEntries((budgets as { _id: unknown; count: number }[]).map((b) => [BUDGET_BUCKETS[String(b._id)], b.count])),
      categoryCounts: Object.fromEntries(CATEGORIES.map((c, i) => [c.key, categoryCounts[i]])),
    };
  } catch (error) {
    console.error("Home page data failed to load:", error);
    return {
      recent: [] as RecentListing[],
      topModels: [] as ModelPrice[],
      latest: [] as CarCardData[],
      bodyGroups: [] as { key: string; label: string; cars: ShowcaseCar[] }[],
      deals: [] as ShowcaseCar[],
      luxury: [] as ShowcaseCar[],
      budget: [] as ShowcaseCar[],
      budgetMax: BUDGET_MAX,
      featured: [] as CarCardData[],
      verifiedCar: undefined,
      activeCount: 0,
      verifiedCount: 0,
      makeOptions: [...BRANDS.map((b) => b.name), ...MORE_MAKES].sort((a, b) => a.localeCompare(b)),
      modelsByMake: {} as Record<string, string[]>,
      makeCounts: {} as Record<string, number>,
      budgetCounts: {} as Record<string, number>,
      categoryCounts: {} as Record<string, number>,
    };
  }
}

export default async function Home() {
  const { appearance } = await getSiteSettings();
  const data = await getHomeData(appearance);

  // Order and visibility come from Admin → Appearance → Homepage; the hero always leads.
  const SECTIONS: Record<HomeSectionKey, () => React.ReactNode> = {
    smartSearch: () => <SmartSearch makes={data.makeOptions} modelsByMake={data.modelsByMake} budgetCounts={data.budgetCounts} config={appearance.sectionConfigs?.smartSearch} />,
    recent: () => <RecentlyListedCars cars={data.latest} config={appearance.sectionConfigs?.recent} />,
    featured: () => <FeaturedCars cars={data.featured} config={appearance.sectionConfigs?.featured} />,
    bodyTypes: () => <BodyTypeShowcase groups={data.bodyGroups} config={appearance.sectionConfigs?.bodyTypes} />,
    hotDeals: () => <HotDealsRail cars={data.deals} config={appearance.sectionConfigs?.hotDeals} />,
    luxury: () => <LuxuryBento cars={data.luxury} config={appearance.sectionConfigs?.luxury} />,
    budget: () => <BudgetPicks cars={data.budget} max={data.budgetMax} config={appearance.sectionConfigs?.budget} />,
    trustStats: () => <TrustStats stats={appearance.trustStats} config={appearance.sectionConfigs?.trustStats} />,
    brands: () => <PopularBrands makeCounts={data.makeCounts} config={appearance.sectionConfigs?.brands} />,
    categories: () => <CategoryGrid counts={data.categoryCounts} config={appearance.sectionConfigs?.categories} categoryImages={appearance.categoryImages} />,
    sellBanner: () => <SellBanner banner={appearance.sellBanner} />,
    whyChoose: () => <WhyChoose verifiedCount={data.verifiedCount} verifiedCar={data.verifiedCar} config={appearance.sectionConfigs?.whyChoose} features={appearance.whyChooseFeatures} />,
    howItWorks: () => <HowItWorks steps={appearance.howItWorksSteps} config={appearance.sectionConfigs?.howItWorks} />,
    aiAssistant: () => <AiAssistant config={appearance.sectionConfigs?.aiAssistant} />,
    reviews: () => <Reviews config={appearance.sectionConfigs?.reviews} />,
    appPromo: () => <AppPromo config={appearance.sectionConfigs?.appPromo} promo={appearance.appPromo} />,
    seoContent: () => <HomeSeoContent models={data.topModels} faqs={appearance.homeFaqs} config={appearance.sectionConfigs?.seoContent} />,
  };

  // Some sections carry no padding of their own on one side and rely on their neighbour. When the
  // neighbour is a full-width coloured band they would touch it, so add the missing space there.
  const shown = appearance.homeSections.filter((s) => s.enabled).map((s) => s.key);
  const spacing = (i: number) => cn(
    OPEN_TOP.has(shown[i]) && (i === 0 || BANDS.has(shown[i - 1])) && "pt-16 md:pt-20",
    OPEN_BOTTOM.has(shown[i]) && (i === shown.length - 1 || BANDS.has(shown[i + 1])) && "pb-16 md:pb-20",
  );

  return (
    <MotionRoot>
    <div className="relative overflow-x-clip bg-white">
      <HeroSection activeCount={data.activeCount} verifiedCount={data.verifiedCount} recent={data.recent} hero={appearance.hero} />
      {shown.map((key, i) => {
        const pad = spacing(i);
        return pad ? <div key={key} className={pad}>{SECTIONS[key]()}</div> : <Fragment key={key}>{SECTIONS[key]()}</Fragment>;
      })}
    </div>
    </MotionRoot>
  );
}
