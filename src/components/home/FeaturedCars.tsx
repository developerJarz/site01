"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, GitCompareArrows, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/context/MarketplaceContext";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { SectionHeading } from "./SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/motion";

import type { HomeSectionConfig } from "@/lib/site-config";

export function FeaturedCars({ cars, config }: { cars: CarCardData[]; config?: HomeSectionConfig }) {
  const { compareCars, openPanel, clearCompare } = useMarketplace();
  const eyebrow = config?.eyebrow || "Featured cars";
  const title = config?.title || <>Hand-picked, checked and <span className="text-highlight">ready to drive</span></>;
  const description = config?.subtitle || "Featured and most-viewed cars right now. Tap compare on up to three to see them side by side.";
  const action = config?.actionLabel && config?.actionHref ? { label: config.actionLabel, href: config.actionHref } : { href: "/cars", label: "Browse all cars" };

  return (
    <section id="featured" aria-labelledby="featured-heading" className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <SectionHeading id="featured-heading" eyebrow={eyebrow} title={title}
        description={description}
        action={action} />

      {cars.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hairline bg-mist p-12 text-center">
          <p className="text-lg font-bold">No cars are listed right now.</p>
          <p className="mt-1 text-slate-text">Be the first: it takes about five minutes.</p>
          <Button asChild className="mt-5"><Link href="/sell">Sell your car</Link></Button>
        </div>
      ) : (
        <Stagger gap={0.05} className="snap-rail sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:p-0 lg:grid-cols-4">
          {cars.map((car, i) => (
            <StaggerItem key={car._id} className="w-[82%] max-w-[20rem] sm:w-auto sm:max-w-none">
              <CarCard car={car} priority={i === 0} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Compare tray: follows the shopper while they pick cars. */}
      <AnimatePresence>
        {compareCars.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-2.5 pl-4 shadow-float backdrop-blur-xl md:bottom-6">
            <GitCompareArrows size={20} className="shrink-0 text-electric" aria-hidden />
            <p className="grow text-sm font-semibold" aria-live="polite">
              {compareCars.length} of 3 selected
              <span className="hidden font-normal text-slate-text sm:inline"> · {compareCars.length < 2 ? "pick one more" : "ready to compare"}</span>
            </p>
            <button type="button" onClick={clearCompare} className="flex size-10 items-center justify-center rounded-xl text-slate-text hover:bg-mist" aria-label="Clear comparison">
              <X size={18} aria-hidden />
            </button>
            <Button size="sm" className="h-10" onClick={() => openPanel("compare")} disabled={compareCars.length < 2}>
              Compare <ArrowRight size={15} aria-hidden />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
