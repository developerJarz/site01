import Link from "next/link";
import { ArrowRight, Check, FileText, Phone, ShieldCheck } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { HeroSearchBar } from "@/components/HeroSearchBar";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { CarImage } from "@/components/CarImage";
import { formatLakh, timeAgo, withServedImages } from "@/lib/utils";

// Rebuilt at most once a minute instead of on every request.
export const revalidate = 60;

const BRANDS = [
  { name: "Toyota", logo: "/brands/toyota.svg" },
  { name: "Honda", logo: "/brands/honda.svg" },
  { name: "Nissan", logo: "/brands/nissan.svg" },
  { name: "Mitsubishi", logo: "/brands/mitsubishi.svg" },
  { name: "Hyundai", logo: "/brands/hyundai.svg" },
  { name: "Kia", logo: "/brands/kia.svg" },
  { name: "Mazda", logo: "/brands/mazda.svg" },
  { name: "BMW", logo: "/brands/bmw.svg" },
  { name: "Mercedes-Benz", logo: "/brands/mercedes.svg" },
  { name: "Audi", logo: "/brands/audi.svg" },
  { name: "Lexus", logo: "/brands/lexus.svg" },
  { name: "Volkswagen", logo: "/brands/volkswagen.svg" },
];

// Budgets as buyers here say them: in lakh and crore.
const BUDGETS = [
  { key: 0, label: "Under 10 lakh", href: "/cars?maxPrice=1000000" },
  { key: 1_000_000, label: "10 – 20 lakh", href: "/cars?minPrice=1000000&maxPrice=2000000" },
  { key: 2_000_000, label: "20 – 40 lakh", href: "/cars?minPrice=2000000&maxPrice=4000000" },
  { key: 4_000_000, label: "40 lakh – 1 crore", href: "/cars?minPrice=4000000&maxPrice=10000000" },
  { key: "top", label: "Above 1 crore", href: "/cars?minPrice=10000000" },
];

const PAPERS = [
  { name: "Registration certificate", detail: "Smart card matches the chassis and engine number" },
  { name: "Tax token", detail: "Paid up and in date" },
  { name: "Fitness certificate", detail: "Valid on the day we check" },
  { name: "Route permit or ownership slip", detail: "Seller is the owner, or has the right to sell" },
];

const STEPS = [
  { title: "Shortlist", body: "Filter by budget, make, fuel and city. Save the cars worth a second look." },
  { title: "Talk to the seller", body: "Message on CarHat, call, or WhatsApp. Ask for the service history." },
  { title: "Inspect in person", body: "See the car in daylight, take a test drive and hold the original papers." },
  { title: "Transfer at BRTA", body: "Complete the name transfer before the full payment changes hands." },
];

const TESTIMONIALS = [
  {
    name: "Rahim Ahmed",
    role: "Bought a Corolla Cross",
    content: "Found my Corolla Cross within three days. The Paper Verified badge meant I wasn't chasing the seller for documents.",
  },
  {
    name: "Fatima Khan",
    role: "Sold a Honda Civic",
    content: "Listed on a Friday, sold by Sunday. I had several serious calls and no time-wasters.",
  },
  {
    name: "Kamal Hossain",
    role: "Dealer, Tejgaon",
    content: "Our reconditioned stock gets far more enquiries here than anywhere else we list.",
  },
];

const CARD_FIELDS = {
  title: 1, slug: 1, price: 1, make: 1, model: 1, year: 1, mileage: 1, fuelType: 1,
  transmission: 1, condition: 1, location: 1, featured: 1, paperVerified: 1, createdAt: 1,
  images: { $slice: 1 },
};

function serialize<T extends { _id: unknown; images?: string[] }>(docs: T[]): T[] {
  return JSON.parse(JSON.stringify(docs.map(withServedImages)));
}

async function getHomeData() {
  try {
    await connectToDatabase();
    const [latest, popular, verified, activeCount, verifiedCount, makes, budgets, cities] = await Promise.all([
      Listing.find({ status: "active" }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(5).lean(),
      Listing.find({ status: "active" }).select(CARD_FIELDS).sort({ featured: -1, views: -1 }).limit(8).lean(),
      Listing.find({ status: "active", paperVerified: true }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(1).lean(),
      Listing.countDocuments({ status: "active" }),
      Listing.countDocuments({ status: "active", paperVerified: true }),
      Listing.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$make", count: { $sum: 1 } } }]),
      Listing.aggregate([
        { $match: { status: "active" } },
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 1_000_000, 2_000_000, 4_000_000, 10_000_000],
            default: "top",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      Listing.distinct("location", { status: "active" }),
    ]);

    return {
      latest: serialize(latest) as unknown as (CarCardData & { createdAt: string })[],
      popular: serialize(popular) as unknown as CarCardData[],
      verifiedCar: (serialize(verified) as unknown as CarCardData[])[0],
      activeCount,
      verifiedCount,
      makeCounts: Object.fromEntries(makes.map((m) => [String(m._id).toLowerCase(), m.count])) as Record<string, number>,
      budgetCounts: Object.fromEntries(budgets.map((b) => [String(b._id), b.count])) as Record<string, number>,
      cityCount: cities.length,
    };
  } catch (error) {
    console.error("Home page data failed to load:", error);
    return {
      latest: [],
      popular: [],
      verifiedCar: undefined,
      activeCount: 0,
      verifiedCount: 0,
      makeCounts: {} as Record<string, number>,
      budgetCounts: {} as Record<string, number>,
      cityCount: 0,
    };
  }
}

export default async function Home() {
  const data = await getHomeData();

  return (
    <div className="flex flex-col">
      {/* ─── Hero: search on the left, the live board of new listings on the right ─── */}
      <section className="on-ink bg-brand-ink relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-14 pt-10 sm:px-6 md:pt-16 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pb-20">
          <div className="lg:col-span-7 lg:pt-6">
            {data.activeCount > 0 && (
              <p className="inline-flex items-center gap-2 text-[15px] font-medium text-[#b9d3f0]">
                <span className="h-2 w-2 rounded-full bg-teal" aria-hidden />
                <span className="tabular">{data.activeCount.toLocaleString("en-IN")}</span> cars for sale in{" "}
                <span className="tabular">{data.cityCount}</span> {data.cityCount === 1 ? "city" : "cities"}
              </p>
            )}
            <h1 className="display mt-4 text-[2.6rem] sm:text-6xl lg:text-[4.25rem]">
              Bangladesh&apos;s car haat, open all day.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#cfe0f5]">
              New, used and reconditioned cars from dealers and owners, with the papers checked
              before the badge goes on.
            </p>
            <div className="mt-8 max-w-2xl">
              <HeroSearchBar />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-2 backdrop-blur-sm">
              <div className="flex items-baseline justify-between px-3 pb-2 pt-2.5">
                <h2 className="font-semiwide text-base font-bold">Just listed</h2>
                <Link href="/cars?sort=newest" className="text-sm font-medium text-teal-soft hover:text-white">
                  See all
                </Link>
              </div>
              {data.latest.length === 0 ? (
                <p className="px-3 pb-4 text-[15px] text-[#b9d3f0]">New listings will appear here as sellers post them.</p>
              ) : (
                <ol className="space-y-1">
                  {data.latest.map((car, i) => (
                    <li key={car._id} className={i >= 3 ? "board-row hidden sm:block" : "board-row"} style={{ animationDelay: `${120 + i * 90}ms` }}>
                      <Link
                        href={`/cars/${car.slug}`}
                        className="flex items-center gap-3 rounded-xl bg-white p-2 pr-3.5 text-foreground transition-transform hover:-translate-y-px"
                      >
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <CarImage src={car.images?.[0]} alt="" sizes="80px" priority={i < 2} />
                        </div>
                        <div className="min-w-0 grow">
                          <p className="truncate text-[15px] font-semibold">{car.title}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {car.location}, {timeAgo(car.createdAt)}
                          </p>
                        </div>
                        <p className="price-tag shrink-0 text-right text-base sm:text-lg">{formatLakh(car.price)}</p>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Budget ─── */}
      <section aria-labelledby="budget-heading" className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <h2 id="budget-heading" className="shrink-0 text-base font-semibold">
              Shop by budget
            </h2>
            <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grow lg:grid-cols-5 lg:px-0">
              {BUDGETS.map((b) => {
                const count = data.budgetCounts[String(b.key)] || 0;
                return (
                  <li key={b.label} className="shrink-0">
                    <Link
                      href={b.href}
                      className="flex h-full flex-col rounded-lg border border-border px-4 py-2.5 transition-colors hover:border-primary hover:bg-accent"
                    >
                      <span className="font-semiwide whitespace-nowrap text-[15px] font-bold">{b.label}</span>
                      <span className="text-sm text-muted-foreground tabular">
                        {count > 0 ? `${count} ${count === 1 ? "car" : "cars"}` : "Browse"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Most viewed ─── */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semiwide text-3xl font-extrabold md:text-4xl">What buyers are looking at</h2>
            <p className="mt-2 text-muted-foreground">Featured and most-viewed cars right now.</p>
          </div>
          <Link
            href="/cars"
            className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary sm:inline-flex"
          >
            Browse all cars <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        {data.popular.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input bg-card p-10 text-center">
            <p className="font-semibold">No cars are listed right now.</p>
            <p className="mt-1 text-muted-foreground">Be the first: it takes about five minutes.</p>
            <Link href="/sell" className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 font-semibold text-white">
              Sell your car
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.popular.map((car) => (
              <CarCard key={car._id} car={car} sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 92vw" />
            ))}
          </div>
        )}

        <Link
          href="/cars"
          className="mt-6 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-3 font-semibold text-primary sm:hidden"
        >
          Browse all cars <ArrowRight size={16} aria-hidden />
        </Link>
      </section>

      {/* ─── Makes ─── */}
      <section aria-labelledby="makes-heading" className="defer-render border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 id="makes-heading" className="font-semiwide text-2xl font-extrabold md:text-3xl">
            Browse by make
          </h2>
          <ul className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4 lg:grid-cols-6">
            {BRANDS.map((brand) => {
              const count = data.makeCounts[brand.name.toLowerCase()] || 0;
              return (
                <li key={brand.name} className="bg-card">
                  <Link
                    href={`/cars?make=${encodeURIComponent(brand.name)}`}
                    className="group flex flex-col items-center gap-2 px-2 py-5 transition-colors hover:bg-accent"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs */}
                    <img src={brand.logo} alt="" width={44} height={44} loading="lazy" decoding="async" className="h-11 w-11 object-contain" />
                    <span className="text-center text-sm font-semibold group-hover:text-primary">{brand.name}</span>
                    <span className="-mt-1.5 text-xs text-muted-foreground tabular">
                      {count > 0 ? `${count} for sale` : " "}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ─── Paper Verified ─── */}
      <section aria-labelledby="papers-heading" className="defer-render mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-verified px-2.5 py-1 text-sm font-semibold text-white">
              <ShieldCheck size={16} aria-hidden /> Paper Verified
            </p>
            <h2 id="papers-heading" className="font-semiwide mt-5 text-3xl font-extrabold leading-tight md:text-[2.6rem]">
              We check the papers before you drive across Dhaka to see the car.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Sellers upload their documents privately. Our team reads each one, and only then does the listing get
              the badge. Buyers never see the scans, just the result.
            </p>
            <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
              {PAPERS.map((p) => (
                <li key={p.name} className="flex items-start gap-3.5 px-5 py-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e3f5ec] text-verified">
                    <Check size={15} strokeWidth={3} aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-[15px] text-muted-foreground">{p.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/cars?verified=1"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-verified px-5 py-3 font-semibold text-white transition-colors hover:bg-[#0c6942]"
            >
              {data.verifiedCount > 0
                ? `See ${data.verifiedCount.toLocaleString("en-IN")} cars with checked papers`
                : "See cars with checked papers"}
              <ArrowRight size={17} aria-hidden />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-[#e3f5ec] sm:-inset-6" aria-hidden />
            {data.verifiedCar ? (
              <CarCard car={data.verifiedCar} sizes="28rem" />
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 shadow-card">
                <FileText size={28} className="text-verified" aria-hidden />
                <p className="mt-4 font-semibold">Selling? Upload your papers with the listing.</p>
                <p className="mt-1 text-muted-foreground">Checked listings show the badge in search and on the car page.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── How buying works ─── */}
      <section aria-labelledby="steps-heading" className="defer-render border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 id="steps-heading" className="font-semiwide text-2xl font-extrabold md:text-3xl">
            Buying a car on CarHat
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                <span className="font-wide text-5xl font-extrabold leading-none text-[#c9d6e6] tabular" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section aria-labelledby="quotes-heading" className="defer-render mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 id="quotes-heading" className="sr-only">
          What buyers and sellers say
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="border-t-2 border-foreground pt-5">
              <blockquote className="text-lg leading-relaxed">&ldquo;{t.content}&rdquo;</blockquote>
              <figcaption className="mt-4 text-[15px]">
                <span className="font-semibold">{t.name}</span>
                <span className="text-muted-foreground">, {t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ─── Sell ─── */}
      <section className="on-ink bg-brand-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="display text-4xl md:text-5xl">Selling your car?</h2>
            <p className="mt-4 text-lg text-[#cfe0f5]">
              Listing is free and takes about five minutes. Add your papers and we&apos;ll check them for the badge.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link
              href="/sell"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-[#e6eefa]"
            >
              Sell your car <ArrowRight size={17} aria-hidden />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
            >
              <Phone size={17} aria-hidden /> Talk to our team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
