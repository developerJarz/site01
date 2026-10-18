/**
 * Default search tags for every public page, written around what people in Bangladesh actually
 * type into Google when buying or selling a car ("car price in Bangladesh", "used car Dhaka",
 * "sell my car BD", "reconditioned car price", "Toyota Axio price in BD"…).
 *
 * Admin → SEO & content can override any field per page; an empty override keeps these.
 * Titles stay under ~60 characters and descriptions under ~158 so Google shows them in full.
 */

export type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface PageSeoDefaults {
  path: string;
  /** Name shown in the admin editor. */
  name: string;
  title: string;
  description: string;
  keywords: string[];
  /** Kept out of Google (account pages). Not listed in the sitemap. */
  noindex?: boolean;
  changeFrequency?: ChangeFrequency;
  priority?: number;
}

export const SITE_NAME = "CarHat BD";

/** Terms every page shares; page keywords come first. */
export const CORE_KEYWORDS = [
  "car price in Bangladesh",
  "used car price in Bangladesh",
  "buy car in Bangladesh",
  "sell car in Bangladesh",
  "car bazar BD",
  "second hand car BD",
  "reconditioned car price in Bangladesh",
  "গাড়ির দাম",
  "পুরাতন গাড়ি বিক্রি",
];

export const PAGE_SEO: PageSeoDefaults[] = [
  {
    path: "/",
    name: "Home",
    title: "Used Car Price in Bangladesh – Buy & Sell Cars | CarHat BD",
    description: "Buy and sell used, reconditioned and new cars in Bangladesh. Compare car prices in Dhaka, Chattogram and Sylhet, contact verified sellers and post your car free.",
    keywords: ["car price in Bangladesh", "used car price in Bangladesh", "buy and sell cars in Bangladesh", "car bazar BD", "second hand car price in BD", "car sale Dhaka"],
    changeFrequency: "daily",
    priority: 1,
  },
  {
    path: "/cars",
    name: "Cars for sale (search)",
    title: "Cars for Sale in Bangladesh – Used & Reconditioned | CarHat BD",
    description: "Browse used, reconditioned and new cars for sale in Bangladesh. Filter Toyota, Honda, Nissan and more by price in lakh, year, fuel and city. Paper Verified listings.",
    keywords: ["cars for sale in Bangladesh", "used cars for sale Dhaka", "reconditioned car for sale", "car under 10 lakh in Bangladesh", "hybrid car price in Bangladesh"],
    changeFrequency: "hourly",
    priority: 0.95,
  },
  {
    path: "/sell",
    name: "Sell your car",
    title: "Sell Your Car in Bangladesh – Free Car Ad | CarHat BD",
    description: "Sell your car fast in Bangladesh. Post a free ad with photos in five minutes, reach serious buyers in Dhaka and across BD, and earn the Paper Verified badge.",
    keywords: ["sell my car Bangladesh", "sell car online BD", "free car ad Bangladesh", "car sell Dhaka", "গাড়ি বিক্রি করুন"],
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/brands",
    name: "Car brands",
    title: "Car Brands & Prices in Bangladesh – All Makes | CarHat BD",
    description: "Compare car prices in Bangladesh by brand: Toyota, Honda, Nissan, Mitsubishi, Hyundai, BMW and more. See live average prices and cars for sale for every make.",
    keywords: ["car brands in Bangladesh", "Toyota car price in Bangladesh", "Honda car price in BD", "Nissan car price in Bangladesh", "car models price list BD"],
    changeFrequency: "daily",
    priority: 0.85,
  },
  {
    path: "/dealers",
    name: "Car dealers",
    title: "Car Dealers & Showrooms in Bangladesh – Verified | CarHat BD",
    description: "Find trusted car dealers and reconditioned car showrooms in Dhaka and across Bangladesh. See each dealer's stock, location and how to contact them.",
    keywords: ["car dealer in Bangladesh", "car showroom Dhaka", "reconditioned car showroom", "recondition car dealer BD", "car showroom Tejgaon"],
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/blog",
    name: "Blog",
    title: "Car Buying Guides & Price News in Bangladesh | CarHat Blog",
    description: "Car buying guides for Bangladesh: price trends, BRTA name transfer, car loans, tax token and fitness renewal, and how to spot a good used or reconditioned car.",
    keywords: ["car buying guide Bangladesh", "BRTA name transfer process", "car loan in Bangladesh", "car tax token renewal", "car price news BD"],
    changeFrequency: "weekly",
    priority: 0.75,
  },
  {
    path: "/reviews",
    name: "Car reviews",
    title: "Car Reviews in Bangladesh – Price, Mileage & Problems | CarHat",
    description: "Honest reviews of the cars Bangladesh buys most: Axio, Premio, Allion, Noah, Vezel and more. Running costs, fuel mileage, common problems and resale value.",
    keywords: ["car review Bangladesh", "Toyota Axio review", "Premio vs Allion", "best family car Bangladesh", "best hybrid car in BD"],
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/about",
    name: "About us",
    title: "About CarHat BD – Bangladesh's Trusted Car Marketplace",
    description: "CarHat BD makes buying and selling cars in Bangladesh safe: Paper Verified listings, fair prices in lakh, one inbox for buyers and sellers, and real support in Dhaka.",
    keywords: ["CarHat BD", "trusted car marketplace Bangladesh", "online car market BD", "car buying website Bangladesh"],
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/contact",
    name: "Contact",
    title: "Contact CarHat BD – Car Buying & Selling Help in Dhaka",
    description: "Call, WhatsApp or email CarHat BD for help buying or selling a car, reporting a listing or becoming a dealer partner. Our Dhaka team replies the same working day.",
    keywords: ["CarHat contact", "car selling help Dhaka", "car marketplace customer care BD", "car dealer partnership Bangladesh"],
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/faq",
    name: "Help & FAQ",
    title: "Buying & Selling a Car in Bangladesh – FAQ | CarHat BD",
    description: "Answers on buying and selling a car in Bangladesh: BRTA name transfer, papers to check, car loans, safe payment, Paper Verified listings and posting a free ad.",
    keywords: ["how to buy a used car in Bangladesh", "BRTA ownership transfer fee", "car papers checklist Bangladesh", "is CarHat free"],
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/privacy",
    name: "Privacy policy",
    title: "Privacy Policy | CarHat BD",
    description: "How CarHat BD collects, uses and protects your information when you buy, sell or browse cars, and the choices you have about your data.",
    keywords: ["CarHat privacy policy"],
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    name: "Terms of use",
    title: "Terms of Use | CarHat BD",
    description: "The rules for buying, selling and listing cars on CarHat BD: accounts, honest listings, the Paper Verified badge, safe deals and our liability.",
    keywords: ["CarHat terms of use"],
    changeFrequency: "yearly",
    priority: 0.3,
  },
  { path: "/login", name: "Sign in", title: "Sign In | CarHat BD", description: "Sign in to CarHat BD to message sellers, save cars and manage your listings.", keywords: [], noindex: true },
  { path: "/register", name: "Create account", title: "Create a Free Account | CarHat BD", description: "Create a free CarHat BD account to buy and sell cars in Bangladesh.", keywords: [], noindex: true },
];

export const PAGE_SEO_BY_PATH = new Map(PAGE_SEO.map((p) => [p.path, p]));

/** Makes with a dedicated price page at /brands/<slug>. */
export const BRAND_PAGES = [
  "Toyota", "Honda", "Nissan", "Mitsubishi", "Hyundai", "Suzuki", "Mazda", "Kia", "BMW", "Mercedes-Benz",
  "Audi", "Lexus", "Volkswagen", "Land Rover", "Porsche", "Tesla", "Subaru", "Proton", "MG", "Tata",
] as const;

export const brandSlug = (make: string) => make.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function brandSeoDefaults(make: string, year = new Date().getFullYear()): PageSeoDefaults {
  return {
    path: `/brands/${brandSlug(make)}`,
    name: `${make} brand page`,
    title: `${make} Car Price in Bangladesh ${year} – Used & Recon | CarHat`,
    description: `Latest ${make} car prices in Bangladesh: used and reconditioned ${make} cars for sale in Dhaka and across BD, with average prices by model and Paper Verified listings.`,
    keywords: [`${make} car price in Bangladesh`, `used ${make} car price in BD`, `reconditioned ${make} price`, `${make} car for sale Dhaka`],
    changeFrequency: "daily",
    priority: 0.8,
  };
}
