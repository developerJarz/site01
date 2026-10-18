/**
 * Website builder settings (Admin → Appearance) and listing-photo watermarking (Admin → Settings).
 * Shared by the API that saves them, the server pages that render them and the client context,
 * so this file stays free of server-only imports. Every value an admin sends goes through
 * sanitizeAppearance / sanitizeWatermark before it reaches the database.
 */

export type LinkItem = { label: string; href: string };
export type FooterColumn = { title: string; links: LinkItem[] };
export type FaqItem = { q: string; a: string };

export const HOME_SECTIONS = [
  { key: "smartSearch", label: "Smart search", description: "Make, model and budget search under the hero" },
  { key: "recent", label: "Recently listed cars", description: "The newest live listings" },
  { key: "featured", label: "Featured cars", description: "Featured and most viewed listings" },
  { key: "bodyTypes", label: "Browse by body type", description: "SUV, sedan, hatchback… tabs" },
  { key: "hotDeals", label: "Hot deals", description: "Cars priced well below the market average" },
  { key: "luxury", label: "Luxury showcase", description: "The most expensive luxury cars" },
  { key: "budget", label: "Budget picks", description: "Cars under 15 lakh" },
  { key: "trustStats", label: "Trust numbers", description: "Cars listed, happy customers, dealers" },
  { key: "brands", label: "Popular brands", description: "Brand logos with live counts" },
  { key: "categories", label: "Categories", description: "Body-type photo tiles" },
  { key: "sellBanner", label: "Sell your car banner", description: "The big call to action for sellers" },
  { key: "whyChoose", label: "Why choose us", description: "Benefits and the Paper Verified story" },
  { key: "howItWorks", label: "How it works", description: "Four steps to buying a car" },
  { key: "aiAssistant", label: "AI car assistant", description: "Describe your car in plain words" },
  { key: "reviews", label: "Customer reviews", description: "Reviews carousel (edit in SEO & content)" },
  { key: "appPromo", label: "Mobile app promo", description: "App Store and Google Play banner" },
  { key: "seoContent", label: "Prices, searches & FAQ", description: "Model prices, popular searches and FAQs" },
] as const;

export type HomeSectionKey = (typeof HOME_SECTIONS)[number]["key"];
export type HomeSectionSetting = { key: HomeSectionKey; enabled: boolean };

export type AnnouncementTone = "brand" | "dark" | "warning" | "success";
export type WatermarkPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
export type WatermarkSize = "small" | "medium" | "large";

export type CarSortOption = "newest" | "price-asc" | "price-desc" | "popular" | "featured" | "discount";
export type CarFilterMode = "all" | "verified" | "handpicked";

/** Advanced section-wise setup: headings, button, car setup & visuals. */
export interface HomeSectionConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionHref: string;
  imageUrl: string;
  // Car setup
  carLimit: number;
  carSort: CarSortOption;
  carFilterMode: CarFilterMode;
  handpickedIds: string[];
  priceThreshold: number;
}

export interface TrustStatItem {
  value: number;
  suffix: string;
  label: string;
  icon: string;
}

export interface WhyChooseFeature {
  title: string;
  body: string;
  icon: string;
}

export interface HowItWorksStep {
  title: string;
  body: string;
}

export interface AppPromoConfig {
  appStoreUrl: string;
  playStoreUrl: string;
  mockupUrl: string;
}

export interface AppearanceSettings {
  faviconUrl: string;
  /** Main brand colour as #rrggbb; empty keeps the built-in CarHat blue. */
  brandColor: string;
  announcement: { enabled: boolean; text: string; linkLabel: string; linkUrl: string; tone: AnnouncementTone };
  header: { navLinks: LinkItem[]; ctaLabel: string; ctaHref: string; showSearch: boolean };
  footer: { columns: FooterColumn[]; bottomNote: string; showNewsletter: boolean; newsletterText: string };
  hero: {
    badge: string;
    titlePrefix: string;
    rotatingWords: string[];
    subtitle: string;
    quickLinks: LinkItem[];
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    showLiveFeed: boolean;
  };
  sellBanner: {
    eyebrow: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  homeSections: HomeSectionSetting[];
  homeFaqs: FaqItem[];
  // Advanced homepage customization:
  sectionConfigs: Record<string, HomeSectionConfig>;
  trustStats: TrustStatItem[];
  whyChooseFeatures: WhyChooseFeature[];
  howItWorksSteps: HowItWorksStep[];
  appPromo: AppPromoConfig;
  categoryImages: Record<string, string>;
}

/**
 * Fonts the watermark can use. Each file ships in src/assets/fonts (see FONTS.md); `family` and
 * `weight` must match the font file so the text renderer picks the right face.
 */
export const WATERMARK_FONTS = [
  { key: "geist", label: "Geist (clean sans)", family: "Geist", file: "geist.ttf", weight: "normal" },
  { key: "poppins", label: "Poppins (like Helvetica)", family: "Poppins", file: "poppins.ttf", weight: "normal" },
  { key: "poppins-bold", label: "Poppins Bold", family: "Poppins", file: "poppins-bold.ttf", weight: "bold" },
  { key: "archivo-black", label: "Archivo Black (heavy)", family: "Archivo Black", file: "archivo-black.ttf", weight: "normal" },
  { key: "anton", label: "Anton (tall, bold)", family: "Anton", file: "anton.ttf", weight: "normal" },
  { key: "bebas-neue", label: "Bebas Neue (condensed)", family: "Bebas Neue", file: "bebas-neue.ttf", weight: "normal" },
  { key: "dm-serif-display", label: "DM Serif Display (serif)", family: "DM Serif Display", file: "dm-serif-display.ttf", weight: "normal" },
  { key: "lobster", label: "Lobster (script)", family: "Lobster", file: "lobster.ttf", weight: "normal" },
  { key: "courier-prime", label: "Courier Prime (typewriter)", family: "Courier Prime", file: "courier-prime.ttf", weight: "normal" },
] as const;
export type WatermarkFont = (typeof WATERMARK_FONTS)[number]["key"];

/** outline: see-through letters with a coloured edge · solid: filled letters · solid-outline: both. */
export type WatermarkStyle = "outline" | "solid" | "solid-outline";

export interface WatermarkSettings {
  enabled: boolean;
  /** Main mark; empty uses the site name. */
  text: string;
  showUploader: boolean;
  /** Words before the uploader's name, e.g. "Uploaded by". Empty shows just the name. */
  uploaderPrefix: string;
  position: WatermarkPosition;
  /** How solid the whole mark is, 0.05 – 1 (the dashboard shows it as transparency). */
  opacity: number;
  size: WatermarkSize;
  /** Fine size adjustment on top of `size`, 50 – 250 (%). */
  scale: number;
  font: WatermarkFont;
  style: WatermarkStyle;
  /** Letter fill (#rrggbb), used by the solid styles. */
  textColor: string;
  /** Edge colour (#rrggbb), used by the outline styles. */
  strokeColor: string;
  /** Edge thickness, 1 – 10. */
  strokeWidth: number;
  /** Soft shadow under the mark, 0 – 100 (%). 0 turns it off. */
  shadow: number;
  /** Extra space between letters, 0 – 30 (% of the font size). */
  letterSpacing: number;
  uppercase: boolean;
  /** Size of the site-name line relative to the uploader line, 40 – 100 (%). */
  siteLineSize: number;
  /** Tilt in degrees, -45 – 45. */
  rotation: number;
}

/** "#compare" in a nav link opens the compare panel instead of a page. */
export const PANEL_LINKS: Record<string, string> = { "#compare": "compare", "#saved": "saved" };

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  faviconUrl: "",
  brandColor: "",
  announcement: { enabled: false, text: "", linkLabel: "", linkUrl: "", tone: "brand" },
  header: {
    navLinks: [
      { label: "Buy Cars", href: "/cars" },
      { label: "Sell Your Car", href: "/sell" },
      { label: "Compare", href: "#compare" },
      { label: "Dealers", href: "/dealers" },
      { label: "Car Reviews", href: "/reviews" },
      { label: "Blog", href: "/blog" },
    ],
    ctaLabel: "Post Listing",
    ctaHref: "/sell",
    showSearch: true,
  },
  footer: {
    columns: [
      {
        title: "Quick Links",
        links: [
          { href: "/cars", label: "Buy cars" },
          { href: "/sell", label: "Sell your car" },
          { href: "/cars?condition=reconditioned", label: "Reconditioned cars" },
          { href: "/cars?verified=1", label: "Paper Verified cars" },
          { href: "/brands", label: "Car prices by brand" },
          { href: "/brands/toyota", label: "Toyota car price in BD" },
          { href: "/dealers", label: "Find a dealer" },
        ],
      },
      {
        title: "Support",
        links: [
          { href: "/faq", label: "Help & FAQ" },
          { href: "/contact", label: "Contact us" },
          { href: "/#inspection", label: "Paper verification" },
          { href: "/privacy", label: "Privacy policy" },
          { href: "/terms", label: "Terms of use" },
        ],
      },
      {
        title: "Company",
        links: [
          { href: "/about", label: "About CarHat BD" },
          { href: "/blog", label: "Blog" },
          { href: "/reviews", label: "Car reviews" },
          { href: "/dealers", label: "Dealer partners" },
        ],
      },
    ],
    bottomNote: "Made for car buyers across all 64 districts of Bangladesh.",
    showNewsletter: true,
    newsletterText: "New arrivals, price drops and buying guides. One email a week, no spam.",
  },
  hero: {
    badge: "Bangladesh's trusted used car marketplace",
    titlePrefix: "Find your next",
    rotatingWords: ["car", "SUV", "hybrid", "sedan", "family MPV"],
    subtitle: "Buy and sell verified used and reconditioned cars in Bangladesh, with transparent prices in lakh and safe BRTA transfer.",
    quickLinks: [
      { label: "Under 10 lakh", href: "/cars?maxPrice=1000000" },
      { label: "Hybrid", href: "/cars?category=hybrid" },
      { label: "SUV", href: "/cars?category=suv" },
      { label: "Paper Verified", href: "/cars?verified=1" },
      { label: "Dhaka", href: "/cars?location=Dhaka" },
    ],
    primaryCtaLabel: "Browse cars",
    primaryCtaHref: "/cars",
    secondaryCtaLabel: "Sell your car",
    secondaryCtaHref: "/sell",
    showLiveFeed: true,
  },
  sellBanner: {
    eyebrow: "For sellers",
    title: "Sell Your Car Easily",
    subtitle: "Get the best price from thousands of verified buyers.",
    imageUrl: "/images/home/sell-banner.jpg",
    ctaLabel: "Post Your Car",
    ctaHref: "/sell",
    secondaryLabel: "Talk to our team",
    secondaryHref: "/contact",
  },
  homeSections: HOME_SECTIONS.map((s) => ({ key: s.key, enabled: true })),
  homeFaqs: [],
  sectionConfigs: {
    smartSearch: {
      eyebrow: "Smart search",
      title: "Find your next car in Bangladesh",
      subtitle: "Search by budget, make, fuel type and body style with live market prices.",
      actionLabel: "Advanced search",
      actionHref: "/cars",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    recent: {
      eyebrow: "Fresh arrivals",
      title: "Recently listed cars",
      subtitle: "The latest cars added to CarHat, newest first. Find your next car before someone else does.",
      actionLabel: "View all listings",
      actionHref: "/cars?sort=newest",
      imageUrl: "",
      carLimit: 8,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    featured: {
      eyebrow: "Featured cars",
      title: "Hand-picked, checked and ready to drive",
      subtitle: "Featured and most-viewed cars right now. Tap compare on up to three to see them side by side.",
      actionLabel: "Browse all cars",
      actionHref: "/cars",
      imageUrl: "",
      carLimit: 8,
      carSort: "popular",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    bodyTypes: {
      eyebrow: "Shop by body type",
      title: "Find the shape that fits your life",
      subtitle: "Fresh stock in each body style, newest first.",
      actionLabel: "Browse all types",
      actionHref: "/cars",
      imageUrl: "",
      carLimit: 4,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    hotDeals: {
      eyebrow: "Price drops & deals",
      title: "Hot deals below market average",
      subtitle: "Cars priced noticeably lower than similar models on CarHat BD.",
      actionLabel: "See all deals",
      actionHref: "/cars",
      imageUrl: "",
      carLimit: 10,
      carSort: "discount",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 5,
    },
    luxury: {
      eyebrow: "Prestige & luxury",
      title: "The luxury collection",
      subtitle: "Executive saloons, flagship SUVs and rare imports.",
      actionLabel: "View all luxury cars",
      actionHref: "/cars?category=luxury",
      imageUrl: "",
      carLimit: 5,
      carSort: "price-desc",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 4000000,
    },
    budget: {
      eyebrow: "Affordable driving",
      title: "Budget picks under 15 lakh",
      subtitle: "Reliable city cars, family sedans and starters without stretching the budget.",
      actionLabel: "Browse budget cars",
      actionHref: "/cars?maxPrice=1500000",
      imageUrl: "",
      carLimit: 6,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 1500000,
    },
    trustStats: {
      eyebrow: "CarHat BD in numbers",
      title: "Trusted by thousands across Bangladesh",
      subtitle: "Verified cars, transparent dealer listings, and real buyers across all 64 districts.",
      actionLabel: "",
      actionHref: "",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    brands: {
      eyebrow: "Popular brands",
      title: "Shop the makes Bangladesh drives",
      subtitle: "Browse trusted manufacturers with live verified inventory across Bangladesh.",
      actionLabel: "All brands",
      actionHref: "/brands",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    categories: {
      eyebrow: "Browse by category",
      title: "What kind of car are you after?",
      subtitle: "From city hatchbacks to seven-seat family movers, start with the body type that fits your life.",
      actionLabel: "Explore all categories",
      actionHref: "/cars",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    sellBanner: {
      eyebrow: "For sellers",
      title: "Sell Your Car Easily",
      subtitle: "Get the best price from thousands of verified buyers.",
      actionLabel: "Post Your Car",
      actionHref: "/sell",
      imageUrl: "/images/home/sell-banner.jpg",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    whyChoose: {
      eyebrow: "Why CarHat BD",
      title: "Buy with the confidence of a dealer",
      subtitle: "Every part of CarHat is built around one question: can you trust this car?",
      actionLabel: "See cars with checked papers",
      actionHref: "/cars?verified=1",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "Four steps to your next car",
      subtitle: "From finding the right car to safe payment and BRTA ownership transfer.",
      actionLabel: "Get started",
      actionHref: "/cars",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    aiAssistant: {
      eyebrow: "AI Car Finder",
      title: "Can't find what you need? Ask our AI assistant",
      subtitle: "Describe your family size, budget and commute in plain words and get instant recommendations.",
      actionLabel: "Try AI Assistant",
      actionHref: "/cars",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    reviews: {
      eyebrow: "Customer reviews",
      title: "Buyers and sellers on CarHat BD",
      subtitle: "Verified feedback from real people across Bangladesh.",
      actionLabel: "Read car reviews",
      actionHref: "/reviews",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    appPromo: {
      eyebrow: "Mobile app",
      title: "CarHat BD in your pocket",
      subtitle: "Browse, save and chat with sellers wherever you are. The app is on its way.",
      actionLabel: "Learn more",
      actionHref: "/app",
      imageUrl: "/images/home/app-car.jpg",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
    seoContent: {
      eyebrow: "Buyer's guide",
      title: "Popular car models, prices & FAQs",
      subtitle: "Compare market values in lakh and learn how to buy and transfer safely in Bangladesh.",
      actionLabel: "",
      actionHref: "",
      imageUrl: "",
      carLimit: 0,
      carSort: "newest",
      carFilterMode: "all",
      handpickedIds: [],
      priceThreshold: 0,
    },
  },
  trustStats: [
    { value: 5000, suffix: "+", label: "Verified Cars", icon: "car" },
    { value: 100000, suffix: "+", label: "Happy Customers", icon: "smile" },
    { value: 300, suffix: "+", label: "Trusted Dealers", icon: "store" },
    { value: 64, suffix: "", label: "District Coverage", icon: "map" },
  ],
  whyChooseFeatures: [
    { title: "Verified Listings", body: "Papers are checked by our team before a listing earns the Paper Verified badge.", icon: "shield" },
    { title: "Professional Inspection", body: "Book a pre-purchase check so you know the engine, body and history before you pay.", icon: "search" },
    { title: "Transparent Pricing", body: "Prices in lakh, as you'd say them, with Hot Deal flags when a car sits below its market.", icon: "tag" },
    { title: "Nationwide Support", body: "From Dhaka to Chattogram and Sylhet, our team helps with calls, visits and BRTA transfer.", icon: "headset" },
  ],
  howItWorksSteps: [
    { title: "Search Cars", body: "Filter by budget, brand, fuel and city. Save the cars worth a second look." },
    { title: "Compare Options", body: "Put up to three cars side by side: price, mileage, papers and seller." },
    { title: "Book Inspection", body: "See the car in daylight, take a test drive and hold the original papers." },
    { title: "Buy Safely", body: "Complete the BRTA name transfer before the full payment changes hands." },
  ],
  appPromo: {
    appStoreUrl: "",
    playStoreUrl: "",
    mockupUrl: "/images/home/app-car.jpg",
  },
  categoryImages: {
    suv: "/images/home/cat-suv.jpg",
    sedan: "/images/home/cat-sedan.jpg",
    hatchback: "/images/home/cat-hatchback.jpg",
    mpv: "/images/home/cat-mpv.jpg",
    pickup: "/images/home/cat-pickup.jpg",
    luxury: "/images/home/cat-luxury.jpg",
    hybrid: "/images/home/cat-hybrid.jpg",
    electric: "/images/home/cat-electric.jpg",
  },
};

export const DEFAULT_WATERMARK: WatermarkSettings = {
  enabled: true,
  text: "",
  showUploader: true,
  uploaderPrefix: "",
  // A see-through mark across the middle of the photo is hardest to crop out.
  position: "center",
  opacity: 0.65,
  size: "medium",
  scale: 100,
  font: "geist",
  style: "outline",
  textColor: "#ffffff",
  strokeColor: "#f6f8fa",
  strokeWidth: 4,
  shadow: 20,
  letterSpacing: 8,
  uppercase: true,
  siteLineSize: 60,
  rotation: 0,
};

/* ─── Sanitising ─────────────────────────────────── */

type Loose = Record<string, unknown>;
const obj = (v: unknown): Loose => (v && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : {});
const str = (v: unknown, max: number, fallback = "") => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : fallback);
const longStr = (v: unknown, max: number, fallback = "") => (typeof v === "string" ? v.trim().slice(0, max) : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

/** Site paths, in-page anchors, web links, email and phone links. Nothing that could run script. */
export function safeHref(v: unknown): string {
  const href = typeof v === "string" ? v.trim().slice(0, 500) : "";
  if (!href) return "";
  if (/^\/(?!\/)[^\s]*$/.test(href) || /^#[\w-]*$/.test(href)) return href;
  if (/^https?:\/\/[^\s/$.?#][^\s]*$/i.test(href)) return href;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href) || /^tel:\+?[\d\s-]{5,20}$/i.test(href)) return href;
  return "";
}

/** An uploaded https image or a file under /public. */
export function safeImageUrl(v: unknown): string {
  const url = typeof v === "string" ? v.trim().slice(0, 1000) : "";
  if (/^https:\/\/\S+$/i.test(url) || /^\/[\w\-./]+$/.test(url)) return url;
  return "";
}

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function links(v: unknown, max: number, fallback: LinkItem[]): LinkItem[] {
  if (!Array.isArray(v)) return fallback;
  return v.slice(0, max).map((l) => ({ label: str(obj(l).label, 40), href: safeHref(obj(l).href) })).filter((l) => l.label && l.href);
}

/** A whole number within [min, max], or the fallback when it isn't a number. */
const intIn = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return v === undefined || v === null || v === "" || !Number.isFinite(n) ? fallback : Math.min(max, Math.max(min, Math.round(n)));
};

function sanitizeSectionConfigs(raw: unknown, base: Record<HomeSectionKey, HomeSectionConfig>): Record<HomeSectionKey, HomeSectionConfig> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const inObj = raw as Record<string, unknown>;
  const out = { ...base };
  for (const h of HOME_SECTIONS) {
    if (inObj[h.key] !== undefined) {
      const s = obj(inObj[h.key]);
      const b = base[h.key];
      out[h.key] = {
        eyebrow: str(s.eyebrow, 80, b.eyebrow),
        title: str(s.title, 120, b.title),
        subtitle: str(s.subtitle, 300, b.subtitle),
        actionLabel: str(s.actionLabel, 50, b.actionLabel),
        actionHref: s.actionHref === undefined ? b.actionHref : safeHref(s.actionHref),
        imageUrl: s.imageUrl === undefined ? b.imageUrl : safeImageUrl(s.imageUrl),
        carLimit: intIn(s.carLimit, 0, 24, b.carLimit),
        carSort: pick(s.carSort, ["newest", "price-asc", "price-desc", "popular", "featured", "discount"] as const, b.carSort),
        carFilterMode: pick(s.carFilterMode, ["all", "verified", "handpicked"] as const, b.carFilterMode),
        handpickedIds: Array.isArray(s.handpickedIds) ? s.handpickedIds.slice(0, 24).map((id) => str(id, 60)).filter(Boolean) : b.handpickedIds,
        priceThreshold: intIn(s.priceThreshold, 0, 500000000, b.priceThreshold),
      };
    }
  }
  return out;
}

function sanitizeTrustStats(raw: unknown, base: TrustStatItem[]): TrustStatItem[] {
  if (!Array.isArray(raw)) return base;
  return raw.slice(0, 8).map((item) => {
    const o = obj(item);
    return {
      value: intIn(o.value, 0, 10000000, 100),
      suffix: str(o.suffix, 10, "+"),
      label: str(o.label, 40, "Stat"),
      icon: str(o.icon, 30, "car"),
    };
  });
}

function sanitizeWhyChooseFeatures(raw: unknown, base: WhyChooseFeature[]): WhyChooseFeature[] {
  if (!Array.isArray(raw)) return base;
  return raw.slice(0, 8).map((item) => {
    const o = obj(item);
    return {
      title: str(o.title, 60, ""),
      body: str(o.body, 250, ""),
      icon: str(o.icon, 30, "shield"),
    };
  }).filter((f) => f.title);
}

function sanitizeHowItWorksSteps(raw: unknown, base: HowItWorksStep[]): HowItWorksStep[] {
  if (!Array.isArray(raw)) return base;
  return raw.slice(0, 6).map((item) => {
    const o = obj(item);
    return {
      title: str(o.title, 60, ""),
      body: str(o.body, 250, ""),
    };
  }).filter((s) => s.title);
}

function sanitizeAppPromo(raw: unknown, base: AppPromoConfig): AppPromoConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  return {
    appStoreUrl: o.appStoreUrl === undefined ? base.appStoreUrl : safeHref(o.appStoreUrl),
    playStoreUrl: o.playStoreUrl === undefined ? base.playStoreUrl : safeHref(o.playStoreUrl),
    mockupUrl: o.mockupUrl === undefined ? base.mockupUrl : safeImageUrl(o.mockupUrl),
  };
}

function sanitizeCategoryImages(raw: unknown, base: Record<string, string>): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  const out = { ...base };
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string") out[k] = safeImageUrl(v);
  }
  return out;
}

export function sanitizeAppearance(input: unknown, base: AppearanceSettings = DEFAULT_APPEARANCE): AppearanceSettings {
  const a = obj(input);
  const ann = obj(a.announcement), header = obj(a.header), footer = obj(a.footer), hero = obj(a.hero), sell = obj(a.sellBanner);
  const color = str(a.brandColor, 7);

  const sections = Array.isArray(a.homeSections) ? a.homeSections : base.homeSections;
  const seen = new Set<string>();
  const homeSections: HomeSectionSetting[] = [];
  for (const s of sections) {
    const key = obj(s).key as HomeSectionKey;
    if (HOME_SECTIONS.some((h) => h.key === key) && !seen.has(key)) {
      seen.add(key);
      homeSections.push({ key, enabled: bool(obj(s).enabled, true) });
    }
  }
  // Sections added in later releases appear, switched on, after the saved ones.
  for (const h of HOME_SECTIONS) if (!seen.has(h.key)) homeSections.push({ key: h.key, enabled: true });

  return {
    faviconUrl: a.faviconUrl === undefined ? base.faviconUrl : safeImageUrl(a.faviconUrl),
    brandColor: a.brandColor === undefined ? base.brandColor : HEX_COLOR.test(color) ? color.toLowerCase() : "",
    announcement: {
      enabled: bool(ann.enabled, base.announcement.enabled),
      text: str(ann.text, 160, base.announcement.text),
      linkLabel: str(ann.linkLabel, 30, base.announcement.linkLabel),
      linkUrl: ann.linkUrl === undefined ? base.announcement.linkUrl : safeHref(ann.linkUrl),
      tone: pick(ann.tone, ["brand", "dark", "warning", "success"] as const, base.announcement.tone),
    },
    header: {
      navLinks: links(header.navLinks, 8, base.header.navLinks),
      ctaLabel: str(header.ctaLabel, 24, base.header.ctaLabel),
      ctaHref: header.ctaHref === undefined ? base.header.ctaHref : safeHref(header.ctaHref),
      showSearch: bool(header.showSearch, base.header.showSearch),
    },
    footer: {
      columns: Array.isArray(footer.columns)
        ? footer.columns.slice(0, 4).map((c) => ({ title: str(obj(c).title, 40), links: links(obj(c).links, 12, []) })).filter((c) => c.title)
        : base.footer.columns,
      bottomNote: str(footer.bottomNote, 160, base.footer.bottomNote),
      showNewsletter: bool(footer.showNewsletter, base.footer.showNewsletter),
      newsletterText: str(footer.newsletterText, 200, base.footer.newsletterText),
    },
    hero: {
      badge: str(hero.badge, 80, base.hero.badge),
      titlePrefix: str(hero.titlePrefix, 40, base.hero.titlePrefix),
      rotatingWords: Array.isArray(hero.rotatingWords)
        ? hero.rotatingWords.slice(0, 8).map((w) => str(w, 24)).filter(Boolean)
        : base.hero.rotatingWords,
      subtitle: str(hero.subtitle, 240, base.hero.subtitle),
      quickLinks: links(hero.quickLinks, 8, base.hero.quickLinks),
      primaryCtaLabel: str(hero.primaryCtaLabel, 30, base.hero.primaryCtaLabel),
      primaryCtaHref: hero.primaryCtaHref === undefined ? base.hero.primaryCtaHref : safeHref(hero.primaryCtaHref),
      secondaryCtaLabel: str(hero.secondaryCtaLabel, 30, base.hero.secondaryCtaLabel),
      secondaryCtaHref: hero.secondaryCtaHref === undefined ? base.hero.secondaryCtaHref : safeHref(hero.secondaryCtaHref),
      showLiveFeed: bool(hero.showLiveFeed, base.hero.showLiveFeed),
    },
    sellBanner: {
      eyebrow: str(sell.eyebrow, 40, base.sellBanner.eyebrow),
      title: str(sell.title, 80, base.sellBanner.title),
      subtitle: str(sell.subtitle, 200, base.sellBanner.subtitle),
      imageUrl: sell.imageUrl === undefined ? base.sellBanner.imageUrl : safeImageUrl(sell.imageUrl),
      ctaLabel: str(sell.ctaLabel, 30, base.sellBanner.ctaLabel),
      ctaHref: sell.ctaHref === undefined ? base.sellBanner.ctaHref : safeHref(sell.ctaHref),
      secondaryLabel: str(sell.secondaryLabel, 30, base.sellBanner.secondaryLabel),
      secondaryHref: sell.secondaryHref === undefined ? base.sellBanner.secondaryHref : safeHref(sell.secondaryHref),
    },
    homeSections,
    homeFaqs: Array.isArray(a.homeFaqs)
      ? a.homeFaqs.slice(0, 20).map((f) => ({ q: str(obj(f).q, 200), a: longStr(obj(f).a, 1200) })).filter((f) => f.q && f.a)
      : base.homeFaqs,
    sectionConfigs: sanitizeSectionConfigs(a.sectionConfigs, base.sectionConfigs),
    trustStats: sanitizeTrustStats(a.trustStats, base.trustStats),
    whyChooseFeatures: sanitizeWhyChooseFeatures(a.whyChooseFeatures, base.whyChooseFeatures),
    howItWorksSteps: sanitizeHowItWorksSteps(a.howItWorksSteps, base.howItWorksSteps),
    appPromo: sanitizeAppPromo(a.appPromo, base.appPromo),
    categoryImages: sanitizeCategoryImages(a.categoryImages, base.categoryImages),
  };
}

/** Fills anything an older saved document is missing with today's defaults. */
export const resolveAppearance = (stored: unknown): AppearanceSettings => sanitizeAppearance(stored ?? {}, DEFAULT_APPEARANCE);
const hex = (v: unknown, fallback: string) => (typeof v === "string" && HEX_COLOR.test(v.trim()) ? v.trim().toLowerCase() : fallback);

export function sanitizeWatermark(input: unknown, base: WatermarkSettings = DEFAULT_WATERMARK): WatermarkSettings {
  const w = obj(input);
  const opacity = Number(w.opacity);
  return {
    enabled: bool(w.enabled, base.enabled),
    text: str(w.text, 40, base.text),
    showUploader: bool(w.showUploader, base.showUploader),
    uploaderPrefix: str(w.uploaderPrefix, 24, base.uploaderPrefix),
    position: pick(w.position, ["bottom-right", "bottom-left", "top-right", "top-left", "center"] as const, base.position),
    opacity: w.opacity !== undefined && Number.isFinite(opacity) ? Math.min(1, Math.max(0.05, Math.round(opacity * 100) / 100)) : base.opacity,
    size: pick(w.size, ["small", "medium", "large"] as const, base.size),
    scale: intIn(w.scale, 50, 250, base.scale),
    font: pick(w.font, WATERMARK_FONTS.map((f) => f.key), base.font),
    style: pick(w.style, ["outline", "solid", "solid-outline"] as const, base.style),
    textColor: hex(w.textColor, base.textColor),
    strokeColor: hex(w.strokeColor, base.strokeColor),
    strokeWidth: intIn(w.strokeWidth, 1, 10, base.strokeWidth),
    shadow: intIn(w.shadow, 0, 100, base.shadow),
    letterSpacing: intIn(w.letterSpacing, 0, 30, base.letterSpacing),
    uppercase: bool(w.uppercase, base.uppercase),
    siteLineSize: intIn(w.siteLineSize, 40, 100, base.siteLineSize),
    rotation: intIn(w.rotation, -45, 45, base.rotation),
  };
}

export const resolveWatermark = (stored: unknown): WatermarkSettings => sanitizeWatermark(stored ?? {}, DEFAULT_WATERMARK);

/* ─── Brand colour ───────────────────────────────── */

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
const mix = (hex: string, with_: number, amount: number) => toHex(toRgb(hex).map((c) => c + (with_ - c) * amount));

function luminance(hex: string) {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of a colour against white (text and buttons sit on white). */
export const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

/**
 * The CSS variables the theme uses, derived from one colour. A colour too light to read on white
 * is darkened until links and button text reach 4.5:1.
 */
export function brandPalette(hex: string) {
  if (!HEX_COLOR.test(hex)) return null;
  let main = hex.toLowerCase();
  for (let i = 0; i < 12 && contrastOnWhite(main) < 4.5; i++) main = mix(main, 0, 0.12);
  const [r, g, b] = toRgb(main);
  return {
    "--color-electric": main,
    "--color-primary": main,
    "--color-ring": main,
    "--color-electric-deep": mix(main, 0, 0.3),
    "--color-accent-foreground": mix(main, 0, 0.3),
    "--color-electric-light": mix(main, 255, 0.22),
    "--color-teal": mix(main, 255, 0.4),
    "--color-haze": mix(main, 255, 0.88),
    "--color-accent": mix(main, 255, 0.88),
    "--color-mist": mix(main, 255, 0.95),
    "--shadow-glow": `0 10px 30px -10px rgb(${r} ${g} ${b} / 0.55)`,
  } as Record<string, string>;
}
