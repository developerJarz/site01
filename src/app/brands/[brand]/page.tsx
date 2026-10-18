import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Car, ChevronDown } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { BRAND_INTROS, loadBrandModelStats, makeFilter, resolveBrand, type BrandModelStats } from "@/lib/brand-pages";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { BRAND_PAGES, brandSeoDefaults, brandSlug } from "@/lib/seo-pages";
import { cn, formatLakh, withServedImages } from "@/lib/utils";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { CONTAINER, EmptyState, PageHero } from "@/components/ui/page";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/seo/JsonLd";

// Prices and stock change through the day; rebuild at most every ten minutes.
export const revalidate = 600;

type Props = { params: Promise<{ brand: string }> };

const CARD_FIELDS = {
  title: 1, slug: 1, price: 1, make: 1, model: 1, year: 1, mileage: 1, fuelType: 1, transmission: 1, color: 1,
  condition: 1, location: 1, featured: 1, paperVerified: 1, status: 1, sellerId: 1, images: { $slice: 1 }, imageAlts: { $slice: 1 },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params;
  const make = await resolveBrand(brand);
  if (!make) return { title: "Brand not found", robots: { index: false } };
  const defaults = brandSeoDefaults(make);
  return buildMetadata(defaults.path, defaults);
}

async function loadBrand(make: string) {
  try {
    await connectToDatabase();
    const [cars, models, total] = await Promise.all([
      Listing.find(makeFilter(make)).select(CARD_FIELDS).sort({ featured: -1, createdAt: -1 }).limit(24)
        .populate("sellerId", "name role isVerified dealershipName").lean(),
      loadBrandModelStats(make),
      Listing.countDocuments(makeFilter(make)),
    ]);
    const cards: CarCardData[] = JSON.parse(JSON.stringify(cars.map((c) => {
      const { sellerId, ...rest } = withServedImages(c as unknown as { _id: unknown; images?: string[]; sellerId?: unknown });
      return { ...rest, seller: sellerId && typeof sellerId === "object" ? sellerId : undefined };
    })));
    return { cards, models, total };
  } catch (error) {
    console.error("Brand page failed to load:", error);
    return { cards: [] as CarCardData[], models: [] as BrandModelStats[], total: 0 };
  }
}

function brandFaq(make: string, models: BrandModelStats[], total: number) {
  const cheapest = [...models].sort((a, b) => a.avgPrice - b.avgPrice)[0];
  const popular = models[0];
  return [
    {
      q: `What is the price of a ${make} car in Bangladesh?`,
      a: models.length
        ? `${make} cars listed on CarHat right now range from ${formatLakh(Math.min(...models.map((m) => m.minPrice)))} to ${formatLakh(Math.max(...models.map((m) => m.maxPrice)))}, depending on model, year, mileage and condition. The table on this page shows the live average price for each ${make} model.`
        : `${make} prices in Bangladesh depend on the model, year, mileage and whether the car is reconditioned or locally used. Check back soon or set up a search: new ${make} listings appear here as soon as they go live.`,
    },
    ...(popular ? [{
      q: `Which ${make} model is most popular in Bangladesh?`,
      a: `On CarHat the ${make} ${popular.model} currently has the most cars for sale (${popular.count}), with an average asking price of ${formatLakh(popular.avgPrice)}.`,
    }] : []),
    ...(cheapest && cheapest !== popular ? [{
      q: `What is the cheapest ${make} car in Bangladesh?`,
      a: `Among ${make} models listed on CarHat, the ${make} ${cheapest.model} has the lowest average asking price, at about ${formatLakh(cheapest.avgPrice)}.`,
    }] : []),
    {
      q: `How do I buy a used ${make} safely in Bangladesh?`,
      a: `Choose a Paper Verified ${make} where possible, inspect the car in daylight with a mechanic, match the chassis and engine numbers to the BRTA registration, and only pay in full once the name transfer is agreed. ${total ? `There are ${total} ${make} cars for sale on CarHat now.` : ""}`.trim(),
    },
  ];
}

export default async function BrandPage({ params }: Props) {
  const { brand } = await params;
  const make = await resolveBrand(brand);
  if (!make) notFound();
  const slug = brandSlug(make);
  const { cards, models, total } = await loadBrand(make);
  const info = BRAND_INTROS[slug];
  const year = new Date().getFullYear();
  const faq = brandFaq(make, models, total);
  const pageUrl = absoluteUrl(`/brands/${slug}`);

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([
          { name: "Home", url: absoluteUrl("/") },
          { name: "Car brands", url: absoluteUrl("/brands") },
          { name: `${make} car price`, url: pageUrl },
        ]),
        faqLd(faq),
        ...(cards.length ? [{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${make} cars for sale in Bangladesh`,
          itemListElement: cards.slice(0, 20).map((c, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/cars/${c.slug}`), name: c.title })),
        }] : []),
      ]} />

      <PageHero
        eyebrow={`${make} in Bangladesh`}
        title={<>{make} car price in <span className="text-gradient-electric">Bangladesh</span> {year}</>}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: make }]}
        description={total
          ? `${total.toLocaleString("en-IN")} used and reconditioned ${make} cars for sale now, with live average prices for every model.`
          : `Used and reconditioned ${make} cars for sale in Bangladesh, with live prices as cars are listed.`}
        actions={<Button asChild><Link href={`/cars?make=${encodeURIComponent(make)}`}>Search all {make} cars <ArrowRight size={16} aria-hidden /></Link></Button>}
      />

      <div className={cn(CONTAINER, "space-y-16 py-12 md:py-16")}>
        <section aria-labelledby="prices-heading" className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <h2 id="prices-heading" className="text-2xl font-extrabold text-night md:text-[1.75rem]">{make} price list in Bangladesh</h2>
            <p className="mt-1 text-sm text-slate-text">Live asking prices of {make} cars on CarHat, updated through the day.</p>
            {models.length ? (
              <div className="mt-5 overflow-x-auto rounded-3xl border border-hairline bg-white shadow-soft">
                <table className="w-full min-w-[34rem] text-left text-[15px]">
                  <thead className="bg-mist text-[13px] uppercase tracking-wide text-slate-text">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Model</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Years</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Price range</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.model} className="border-t border-hairline">
                        <th scope="row" className="px-4 py-3 font-semibold text-night">
                          <Link href={`/cars?make=${encodeURIComponent(make)}&model=${encodeURIComponent(m.model)}`} className="hover:text-electric">
                            {make} {m.model}
                          </Link>
                          <span className="block text-xs font-normal text-slate-text">{m.count} for sale</span>
                        </th>
                        <td className="px-4 py-3 text-slate-text tabular">{m.minYear === m.maxYear ? m.minYear : `${m.minYear}–${m.maxYear}`}</td>
                        <td className="px-4 py-3 text-right text-slate-text tabular">
                          {m.minPrice === m.maxPrice ? formatLakh(m.minPrice) : `${formatLakh(m.minPrice)} – ${formatLakh(m.maxPrice)}`}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-night tabular">{formatLakh(m.avgPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-5 rounded-3xl border border-hairline bg-white p-6 text-slate-text">
                No {make} cars are listed right now. Prices appear here as soon as sellers post them.
              </p>
            )}
          </div>

          <div className="space-y-4 text-[16px] leading-relaxed text-slate-text">
            <h2 className="text-2xl font-extrabold text-night md:text-[1.75rem]">Buying a {make} in Bangladesh</h2>
            <p>{info?.intro || `${make} cars are available in Bangladesh as reconditioned imports from Japan and as locally used cars. Compare prices, years and mileage below, and look for the Paper Verified badge for cars whose papers our team has checked.`}</p>
            {info?.models && (
              <p>
                Popular {make} models in Bangladesh:{" "}
                {info.models.map((m, i) => (
                  <span key={m}>
                    <Link href={`/cars?make=${encodeURIComponent(make)}&model=${encodeURIComponent(m)}`} className="font-semibold text-electric hover:underline">{make} {m}</Link>
                    {i < info.models.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
            )}
            <p>
              Reconditioned {make} cars usually cost more than locally used ones of the same year but come with lower mileage and no
              previous owner in Bangladesh. Whichever you choose, check the BRTA registration, tax token and fitness certificate, and
              have a mechanic inspect the car before paying. Selling a {make}? <Link href="/sell" className="font-semibold text-electric hover:underline">Post a free ad</Link>.
            </p>
          </div>
        </section>

        <section aria-labelledby="cars-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 id="cars-heading" className="text-2xl font-extrabold text-night md:text-[1.75rem]">{make} cars for sale</h2>
            {total > cards.length && (
              <Link href={`/cars?make=${encodeURIComponent(make)}`} className="text-sm font-semibold text-electric hover:underline">
                See all {total.toLocaleString("en-IN")} {make} cars
              </Link>
            )}
          </div>
          {cards.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((c, i) => <CarCard key={c._id} car={c} priority={i < 4} sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 92vw" />)}
            </div>
          ) : (
            <EmptyState icon={Car} title={`No ${make} cars listed right now`} body="New cars are added every day. Browse other brands, or sell your own car for free."
              action={<Button asChild><Link href="/cars">Browse all cars</Link></Button>} />
          )}
        </section>

        <section aria-labelledby="faq-heading" className="max-w-3xl">
          <h2 id="faq-heading" className="text-2xl font-extrabold text-night md:text-[1.75rem]">{make} price in Bangladesh: FAQ</h2>
          <div className="mt-5 space-y-3">
            {faq.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-hairline bg-white shadow-soft open:border-electric/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-night [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[16px]">{item.q}</h3>
                  <ChevronDown size={18} className="shrink-0 text-slate-text transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-5 pb-5 text-[15px] leading-relaxed text-slate-text">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <nav aria-labelledby="brands-heading">
          <h2 id="brands-heading" className="text-xl font-extrabold text-night">Other car brands in Bangladesh</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {BRAND_PAGES.filter((m) => brandSlug(m) !== slug).map((m) => (
              <li key={m}>
                <Link href={`/brands/${brandSlug(m)}`} className="inline-flex h-9 items-center rounded-full border border-hairline bg-white px-3.5 text-sm font-medium text-night hover:border-electric/40 hover:text-electric">
                  {m} price
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
