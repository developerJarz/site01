import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "./data";
import { SectionHeading } from "./SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/motion";

import type { HomeSectionConfig } from "@/lib/site-config";

export function CategoryGrid({ counts, config, categoryImages }: { counts: Record<string, number>; config?: HomeSectionConfig; categoryImages?: Record<string, string> }) {
  const eyebrow = config?.eyebrow || "Browse by category";
  const title = config?.title || "What kind of car are you after?";
  const description = config?.subtitle || "From city hatchbacks to seven-seat family movers, start with the body type that fits your life.";
  const action = config?.actionLabel && config?.actionHref ? { label: config.actionLabel, href: config.actionHref } : undefined;

  return (
    <section aria-labelledby="categories-heading" className="bg-mist">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <SectionHeading id="categories-heading" eyebrow={eyebrow} title={title}
          description={description} action={action} />
        <Stagger gap={0.05} className="snap-rail sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:p-0 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.key] || 0;
            const img = categoryImages?.[cat.key] || cat.image;
            return (
              <StaggerItem key={cat.key} className="w-[15rem] sm:w-auto">
                <Link href={`/cars?category=${cat.key}`} className="group relative block aspect-[5/4] overflow-hidden rounded-3xl bg-night shadow-soft transition-shadow duration-300 hover:shadow-float">
                  <Image src={img} alt="" fill sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 240px"
                    className="object-cover object-[center_65%] transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/75 via-transparent to-transparent" aria-hidden />
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-night/45 px-3.5 py-2.5 text-white backdrop-blur-md">
                    <span>
                      <span className="block text-lg font-bold leading-tight">{cat.label}</span>
                      <span className="text-[13px] text-white/90 tabular">{count > 0 ? `${count.toLocaleString("en-IN")} available` : "Browse cars"}</span>
                    </span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-night transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight size={18} aria-hidden />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
