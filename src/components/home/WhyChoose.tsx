import Link from "next/link";
import { ArrowRight, Check, Headset, ScanSearch, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { PAPERS, FEATURES } from "./data";
import { SectionHeading } from "./SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";


import type { HomeSectionConfig, WhyChooseFeature } from "@/lib/site-config";

const ICONS: Record<string, typeof ShieldCheck> = { shield: ShieldCheck, search: ScanSearch, tag: Tag, headset: Headset };

export function WhyChoose({ verifiedCount, verifiedCar, config, features }: {
  verifiedCount: number;
  verifiedCar?: CarCardData;
  config?: HomeSectionConfig;
  features?: WhyChooseFeature[];
}) {
  const eyebrow = config?.eyebrow || "Why CarHat BD";
  const title = config?.title || "Buy with the confidence of a dealer";
  const description = config?.subtitle || "Every part of CarHat is built around one question: can you trust this car?";
  const items = features && features.length > 0 ? features : FEATURES;

  return (
    <section aria-labelledby="why-heading" className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <SectionHeading id="why-heading" eyebrow={eyebrow} title={title} center
        description={description} />

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((f) => {
          const Icon = ICONS[f.icon || "shield"] || ShieldCheck;
          return (
            <StaggerItem key={f.title} className="group rounded-3xl border border-hairline bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-electric/20 hover:shadow-float motion-reduce:hover:translate-y-0">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-electric-light text-white shadow-glow transition-transform duration-300 group-hover:scale-105">
                <Icon size={26} aria-hidden />
              </span>
              <h3 className="mt-6 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-text">{f.body}</p>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* Paper Verified: what the badge means. Also the "Car Inspection" menu target. */}
      <div id="inspection" className="mt-6 scroll-mt-32 overflow-hidden rounded-[32px] border border-hairline bg-gradient-to-br from-mist via-white to-haze">
        <div className="grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full bg-verified px-3 py-1.5 text-[13px] font-semibold text-white">
              <ShieldCheck size={15} aria-hidden /> Paper Verified
            </p>
            <h3 className="mt-5 text-3xl font-extrabold leading-tight md:text-[2.4rem]">We check the papers before you drive across Dhaka to see the car.</h3>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-slate-text">
              Sellers upload their documents privately. Our team reads each one, and only then does the listing get the badge.
              Buyers never see the scans, just the result.
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {PAPERS.map((p) => (
                <li key={p.name} className="flex items-start gap-3 rounded-2xl border border-white bg-white/75 p-4 shadow-soft backdrop-blur">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e3f5ec] text-verified"><Check size={14} strokeWidth={3} aria-hidden /></span>
                  <span>
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="block text-[13px] leading-snug text-slate-text">{p.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 bg-verified shadow-none hover:bg-[#0c6942]">
              <Link href="/cars?verified=1">
                {verifiedCount > 0 ? `See ${verifiedCount.toLocaleString("en-IN")} cars with checked papers` : "See cars with checked papers"}
                <ArrowRight size={17} aria-hidden />
              </Link>
            </Button>
          </Reveal>
          {verifiedCar && (
            <Reveal delay={0.15} className="mx-auto w-full max-w-sm">
              <CarCard car={verifiedCar} />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
