import Link from "next/link";
import { brandSlug } from "@/lib/seo-pages";
import { BRANDS } from "./data";
import { SectionHeading } from "./SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/motion";

import type { HomeSectionConfig } from "@/lib/site-config";

export function PopularBrands({ makeCounts, config }: { makeCounts: Record<string, number>; config?: HomeSectionConfig }) {
  const eyebrow = config?.eyebrow || "Popular brands";
  const title = config?.title || "Shop the makes Bangladesh drives";
  const action = config?.actionLabel && config?.actionHref ? { label: config.actionLabel, href: config.actionHref } : { href: "/brands", label: "All brands" };

  return (
    <section aria-labelledby="brands-heading" className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <SectionHeading id="brands-heading" eyebrow={eyebrow} title={title}
        description={config?.subtitle}
        action={action} />
      <Stagger gap={0.05} className="snap-rail sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:p-0 lg:grid-cols-8">
        {BRANDS.map((brand) => {
          const count = makeCounts[brand.name.toLowerCase()] || 0;
          return (
            <StaggerItem key={brand.name} className="w-[9.5rem] md:w-auto">
              <Link href={`/brands/${brandSlug(brand.name)}`}
                className="group flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-hairline bg-white px-3 py-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-electric/25 hover:shadow-float motion-reduce:hover:translate-y-0">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-mist transition-colors group-hover:bg-haze">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs */}
                  <img src={brand.logo} alt="" width={40} height={40} loading="lazy" decoding="async" className="size-10 object-contain transition-transform duration-300 group-hover:scale-110" />
                </span>
                <span className="text-center">
                  <span className="block text-[15px] font-bold text-night group-hover:text-electric">{brand.label ?? brand.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-text tabular">{count > 0 ? `${count} ${count === 1 ? "car" : "cars"}` : "Browse"}</span>
                </span>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
