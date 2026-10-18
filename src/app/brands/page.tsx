import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { loadBrandSummaries, type BrandSummary } from "@/lib/brand-pages";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { BRAND_PAGES, brandSlug } from "@/lib/seo-pages";
import { BRANDS } from "@/components/home/data";
import { CONTAINER, PageHero } from "@/components/ui/page";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { cn, formatLakh } from "@/lib/utils";

export const revalidate = 600;

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/brands");

const LOGOS = new Map(BRANDS.map((b) => [brandSlug(b.name), b.logo]));

export default async function BrandsPage() {
  let brands: BrandSummary[];
  try {
    await connectToDatabase();
    brands = await loadBrandSummaries();
  } catch (error) {
    console.error("Brands failed to load:", error);
    brands = BRAND_PAGES.map((make) => ({ make, slug: brandSlug(make), count: 0, avgPrice: 0 }));
  }

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", url: absoluteUrl("/") }, { name: "Car brands", url: absoluteUrl("/brands") }])} />
      <PageHero
        eyebrow="Car brands"
        title={<>Car prices in Bangladesh <span className="text-gradient-electric">by brand</span></>}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Brands" }]}
        description="Pick a make to see live prices for every model, the cars for sale now and what to check before you buy."
      />
      <div className={cn(CONTAINER, "py-12 md:py-16")}>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link href={`/brands/${b.slug}`} className="group flex h-full flex-col rounded-3xl border border-hairline bg-white p-5 shadow-soft transition-colors hover:border-electric/40">
                <span className="flex items-center gap-3">
                  {LOGOS.get(b.slug) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small static SVG logos
                    <img src={LOGOS.get(b.slug)} alt={`${b.make} logo`} width={36} height={36} loading="lazy" className="size-9 object-contain" />
                  ) : (
                    <span className="flex size-9 items-center justify-center rounded-xl bg-haze text-sm font-extrabold text-electric" aria-hidden>{b.make[0]}</span>
                  )}
                  <span className="font-bold text-night group-hover:text-electric">{b.make}</span>
                </span>
                <span className="mt-4 text-sm text-slate-text">
                  {b.count ? <>{b.count.toLocaleString("en-IN")} for sale · avg <span className="font-semibold text-night tabular">{formatLakh(b.avgPrice)}</span></> : "Prices as cars are listed"}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-electric">
                  {b.make} car price <ArrowRight size={14} aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
