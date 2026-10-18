"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavSearch } from "@/components/layout/NavSearch";
import type { RecentListing } from "@/lib/recent-listings";
import type { AppearanceSettings } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { LiveListings } from "./LiveListings";

const EASE = [0.22, 1, 0.36, 1] as const;
/**
 * Keyframes for any number of rotating words: each word holds for 80% of its slot, then rolls up.
 * The first word repeats at the end so the loop has no jump (see .word-rotator).
 */
function rollKeyframes(name: string, count: number) {
  const slot = 100 / count;
  const steps = Array.from({ length: count }, (_, i) =>
    `${(i * slot).toFixed(2)}%, ${(i * slot + slot * 0.8).toFixed(2)}% { transform: translateY(-${(i * 1.12).toFixed(2)}em); }`);
  return `@keyframes ${name} { ${steps.join(" ")} 100% { transform: translateY(-${(count * 1.12).toFixed(2)}em); } }`;
}

/** Compact hero: search on the left, the live feed of new cars on the right, so cars show above the fold. */
export function HeroSection({ activeCount, verifiedCount, recent, hero }: {
  activeCount: number; verifiedCount: number; recent: RecentListing[]; hero: AppearanceSettings["hero"];
}) {
  const reduce = useReducedMotion();
  const words = hero.rotatingWords.length ? hero.rotatingWords : ["car"];
  const rollName = `word-roll-${words.length}`;
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE, delay },
  });

  return (
    <section aria-labelledby="hero-heading" className="hero-backdrop relative isolate">
      {words.length > 1 && <style>{rollKeyframes(rollName, words.length)}</style>}
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className={cn(
        "mx-auto grid max-w-[1320px] gap-8 px-4 pb-10 pt-6 sm:px-6 md:pt-8 lg:items-center lg:gap-12 lg:px-8 lg:pb-14",
        hero.showLiveFeed && "lg:grid-cols-[minmax(0,1fr)_25rem] xl:grid-cols-[minmax(0,1fr)_27rem]"
      )}>
        <div className="relative z-10 min-w-0">
          <motion.p {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-electric/15 bg-white/80 py-1 pl-1 pr-3 text-[12.5px] font-semibold text-electric-deep shadow-soft backdrop-blur">
            <span className="flex size-6 items-center justify-center rounded-full bg-electric text-white"><ShieldCheck size={13} aria-hidden /></span>
            {hero.badge}
          </motion.p>

          <motion.h1 {...rise(0.06)} id="hero-heading" className="mt-4 text-[2.4rem] font-extrabold leading-[1.08] text-night sm:text-5xl lg:text-[3.4rem]">
            <span className="sr-only">{hero.titlePrefix} {words[0]} in Bangladesh: buy and sell used cars</span>
            <span aria-hidden>
              {hero.titlePrefix}{" "}
              {words.length > 1 ? (
                <span className="word-rotator">
                  <span style={{ "--roll-name": rollName, "--roll-duration": `${words.length * 2.5}s` } as React.CSSProperties}>
                    {[...words, words[0]].map((w, i) => <span key={i} className="text-aurora pr-1">{w}</span>)}
                  </span>
                </span>
              ) : (
                <span className="text-aurora pr-1">{words[0]}</span>
              )}
            </span>
          </motion.h1>

          <motion.p {...rise(0.12)} className="mt-3 max-w-lg text-base leading-relaxed text-slate-text md:text-[17px]">
            {hero.subtitle}
          </motion.p>

          <motion.div {...rise(0.18)} className="relative z-30 mt-6 max-w-xl">
            <NavSearch />
            {hero.quickLinks.length > 0 && <ul className="mt-3 flex flex-wrap gap-2" aria-label="Quick searches">
              {hero.quickLinks.map((q) => (
                <li key={q.label}>
                  <Link href={q.href} className="inline-flex h-8 items-center rounded-full border border-hairline bg-white/80 px-3 text-[13px] font-semibold text-night backdrop-blur transition-colors hover:border-electric/40 hover:text-electric">
                    {q.label}
                  </Link>
                </li>
              ))}
            </ul>}
          </motion.div>

          <motion.div {...rise(0.24)} className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex flex-wrap gap-2">
              {hero.primaryCtaLabel && hero.primaryCtaHref && (
                <Button asChild className="btn-shine group">
                  <Link href={hero.primaryCtaHref}>{hero.primaryCtaLabel} <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
                </Button>
              )}
              {hero.secondaryCtaLabel && hero.secondaryCtaHref && (
                <Button asChild variant="secondary"><Link href={hero.secondaryCtaHref}>{hero.secondaryCtaLabel}</Link></Button>
              )}
            </div>
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="sr-only">Cars for sale</dt>
                <dd className="flex items-center gap-1.5"><Sparkles size={15} className="text-electric" aria-hidden /><span className="font-extrabold text-night tabular">{activeCount > 0 ? activeCount.toLocaleString("en-IN") : "New"}</span> <span className="text-slate-text">cars live</span></dd>
              </div>
              <div>
                <dt className="sr-only">Paper Verified cars</dt>
                <dd className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-verified" aria-hidden /><span className="font-extrabold text-night tabular">{verifiedCount.toLocaleString("en-IN")}</span> <span className="text-slate-text">verified</span></dd>
              </div>
            </dl>
          </motion.div>
        </div>

        {hero.showLiveFeed && <motion.div
          initial={reduce ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="min-w-0"
        >
          <LiveListings initial={recent} />
        </motion.div>}
      </div>
    </section>
  );
}
