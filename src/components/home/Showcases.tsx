"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Crown, Flame, Fuel, Gauge, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { Price, FUEL_LABEL, type CarCardData } from "@/components/CarCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/ui/motion";
import { cn, formatKm, formatLakh } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";
import { listingImageAlt } from "@/lib/seo-text";

import type { HomeSectionConfig } from "@/lib/site-config";

export type ShowcaseCar = CarCardData & { createdAt?: string; discount?: number; marketAvg?: number };

const carName = (car: ShowcaseCar) => (car.make && car.model ? `${car.make} ${car.model}` : car.title);
const specLine = (car: ShowcaseCar) =>
  [car.year, car.mileage !== undefined ? formatKm(car.mileage) : null, car.fuelType ? FUEL_LABEL[car.fuelType] || car.fuelType : null].filter(Boolean).join(" · ");

/** Vertical card used by the tabbed and rail showcases. `data-listing-id` feeds impression and click tracking. */
function Tile({ car, sizes, badge }: { car: ShowcaseCar; sizes: string; badge?: React.ReactNode }) {
  return (
    <article data-listing-id={car._id} className="group/tile relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-electric/20 hover:shadow-float motion-reduce:hover:translate-y-0">
      <Link href={`/cars/${car.slug}`} className="absolute inset-0 z-10" aria-label={`${carName(car)}, ${formatLakh(car.price)}`} />
      <div className="relative aspect-[16/11] overflow-hidden bg-mist">
        <CarImage src={car.images?.[0]} alt={listingImageAlt(car)} sizes={sizes} className="transition-transform duration-700 ease-out group-hover/tile:scale-110 motion-reduce:group-hover/tile:scale-100" />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {badge}
          {car.paperVerified && <Badge variant="verified"><ShieldCheck aria-hidden /> Verified</Badge>}
        </div>
      </div>
      <div className="flex grow flex-col p-4">
        <h3 className="line-clamp-1 font-bold text-night group-hover/tile:text-electric">{carName(car)}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-text tabular">{specLine(car)}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Price value={car.price} size="sm" className="!text-electric" />
          <span className="flex min-w-0 items-center gap-1 truncate text-xs text-slate-text"><MapPin size={12} className="shrink-0" aria-hidden /><span className="truncate">{car.location || "Bangladesh"}</span></span>
        </div>
      </div>
    </article>
  );
}

/* ── 2. Browse by body type: tabs ─────────────────────────────────────────── */

export function BodyTypeShowcase({ groups, config }: { groups: { key: string; label: string; cars: ShowcaseCar[] }[]; config?: HomeSectionConfig }) {
  const shown = groups.filter((g) => g.cars.length > 0);
  if (!shown.length) return null;
  const eyebrow = config?.eyebrow || "Shop by body type";
  const title = config?.title || <>Find the <span className="text-highlight">shape that fits</span> your life</>;
  const description = config?.subtitle || "Fresh stock in each body style, newest first.";

  return (
    <section aria-labelledby="bodytype-heading" className="bg-mist">
      <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <Tabs defaultValue={shown[0].key} className="gap-0">
          <SectionHeading id="bodytype-heading" eyebrow={eyebrow} className="md:mb-8"
            title={title}
            description={description} />
          <TabsList aria-label="Body type" className="mb-6 bg-white shadow-soft">
            {shown.map((g) => <TabsTrigger key={g.key} value={g.key} className="data-[state=active]:bg-electric data-[state=active]:text-white">{g.label}</TabsTrigger>)}
          </TabsList>
          {shown.map((g) => (
            <TabsContent key={g.key} value={g.key} className="animate-in">
              <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {g.cars.map((car) => <li key={car._id}><Tile car={car} sizes="(min-width: 1024px) 300px, 46vw" /></li>)}
              </ul>
              <Link href={`/cars?category=${g.key}`} className="group mt-6 inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-electric">
                See every {g.label.toLowerCase()} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

/* ── 3. Hot deals: scroll rail ───────────────────────────────────────────── */

export function HotDealsRail({ cars, config }: { cars: ShowcaseCar[]; config?: HomeSectionConfig }) {
  const rail = useRef<HTMLUListElement>(null);
  if (!cars.length) return null;
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });
  const eyebrow = config?.eyebrow || "Hot deals";
  const title = config?.title || <>Priced <span className="text-highlight">below the market</span></>;
  const description = config?.subtitle || "Each car is compared with the average asking price of the same make and model live on CarHat right now.";

  return (
    <section aria-labelledby="deals-heading" className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Reveal className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#c2410c]"><Flame size={14} aria-hidden /> {eyebrow}</p>
          <h2 id="deals-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] text-night md:text-[2.6rem]">{title}</h2>
          <p className="mt-3 text-[17px] leading-relaxed text-slate-text">{description}</p>
        </Reveal>
        <div className="hidden gap-2 md:flex">
          <Button variant="secondary" size="icon" onClick={() => scroll(-1)} aria-label="Previous deals"><ChevronLeft size={20} aria-hidden /></Button>
          <Button variant="secondary" size="icon" onClick={() => scroll(1)} aria-label="More deals"><ChevronRight size={20} aria-hidden /></Button>
        </div>
      </div>
      <ul ref={rail} className="snap-rail md:mx-0 md:px-0" aria-label="Hot deals">
        {cars.map((car) => (
          <li key={car._id} className="w-[72%] max-w-[18rem] sm:w-[18rem]">
            <Tile car={car} sizes="288px" badge={car.discount ? <Badge variant="hot"><Flame aria-hidden /> {Math.round(car.discount * 100)}% below avg</Badge> : null} />
            {car.marketAvg ? <p className="mt-2 px-1 text-xs text-slate-text">Market average <span className="font-semibold text-night tabular">{formatLakh(car.marketAvg)}</span></p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── 4. Luxury spotlight: dark bento ──────────────────────────────────────── */

export function LuxuryBento({ cars, config }: { cars: ShowcaseCar[]; config?: HomeSectionConfig }) {
  if (cars.length < 3) return null;
  const [hero, ...rest] = cars.slice(0, 5);
  const eyebrow = config?.eyebrow || "Luxury spotlight";
  const title = config?.title || "The finest cars on CarHat";
  const actionLabel = config?.actionLabel || "All luxury cars";
  const actionHref = config?.actionHref || "/cars?category=luxury";

  return (
    <section aria-labelledby="luxury-heading" className="relative isolate overflow-hidden bg-night text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_0%,rgb(34_180_196/0.26),transparent_70%),radial-gradient(40%_50%_at_0%_100%,rgb(14_106_168/0.32),transparent_70%)]" aria-hidden />
      <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#8fd8e2]"><Crown size={14} aria-hidden /> {eyebrow}</p>
            <h2 id="luxury-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">{title}</h2>
          </Reveal>
          <Link href={actionHref} className="group inline-flex h-11 items-center gap-1.5 self-start text-sm font-semibold text-[#8fd8e2] hover:text-white md:self-auto">
            {actionLabel} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          <li className="sm:col-span-2 lg:row-span-2"><BentoCard car={hero} large /></li>
          {rest.map((car) => <li key={car._id}><BentoCard car={car} /></li>)}
        </ul>
      </div>
    </section>
  );
}

function BentoCard({ car, large }: { car: ShowcaseCar; large?: boolean }) {
  return (
    <article data-listing-id={car._id} className={cn("group/bento relative isolate h-full overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10", large ? "min-h-[20rem] lg:min-h-[28rem]" : "min-h-[13rem]")}>
      <CarImage src={car.images?.[0]} alt={listingImageAlt(car)} sizes={large ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 320px, 50vw"}
        className="-z-10 transition-transform duration-700 ease-out group-hover/bento:scale-105 motion-reduce:group-hover/bento:scale-100" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/40 to-transparent" aria-hidden />
      <div className={cn("absolute inset-x-0 bottom-0", large ? "p-6 md:p-8" : "p-4")}>
        {car.paperVerified && <Badge variant="verified" className="mb-2"><ShieldCheck aria-hidden /> Verified</Badge>}
        <h3 className={cn("font-extrabold", large ? "text-2xl md:text-3xl" : "text-base")}>
          <Link href={`/cars/${car.slug}`} className="after:absolute after:inset-0 hover:underline">{carName(car)}</Link>
        </h3>
        <p className="mt-1 text-sm text-white/75 tabular">{specLine(car)}</p>
        <p className={cn("price-tag mt-2", large ? "text-3xl" : "text-lg")}>{formatLakh(car.price)}</p>
      </div>
    </article>
  );
}

/* ── 5. Budget picks: compact rows ────────────────────────────────────────── */

export function BudgetPicks({ cars, max, config }: { cars: ShowcaseCar[]; max: number; config?: HomeSectionConfig }) {
  if (!cars.length) return null;
  const eyebrow = config?.eyebrow || "Budget picks";
  const title = config?.title || <>Great cars <span className="text-highlight">under {formatLakh(max)}</span></>;
  const description = config?.subtitle || "Affordable, recently listed and ready for their next owner.";
  const action = config?.actionLabel && config?.actionHref ? { label: config.actionLabel, href: config.actionHref } : { href: `/cars?maxPrice=${max}`, label: "Shop this budget" };

  return (
    <section aria-labelledby="budget-heading" className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <SectionHeading id="budget-heading" eyebrow={eyebrow} className="md:mb-8"
        title={title}
        description={description}
        action={action} />
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cars.map((car) => (
          <li key={car._id} data-listing-id={car._id}>
            <Link href={`/cars/${car.slug}`} className="group flex items-center gap-4 rounded-2xl border border-hairline bg-white p-3 shadow-soft transition-[border-color,box-shadow] hover:border-electric/25 hover:shadow-float">
              <span className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-mist sm:w-32">
                <CarImage src={car.images?.[0]} alt="" sizes="128px" className="transition-transform duration-500 group-hover:scale-110" />
              </span>
              <span className="min-w-0 grow">
                <span className="block truncate font-bold text-night group-hover:text-electric">{carName(car)}</span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-text tabular">
                  {car.mileage !== undefined && <span className="inline-flex items-center gap-1"><Gauge size={12} aria-hidden /> {formatKm(car.mileage)}</span>}
                  {car.fuelType && <span className="inline-flex items-center gap-1"><Fuel size={12} aria-hidden /> {FUEL_LABEL[car.fuelType] || car.fuelType}</span>}
                  {car.year && <span>{car.year}</span>}
                </span>
                <span className="mt-2 flex items-center justify-between gap-2">
                  <span className="price-tag text-lg text-electric">{formatLakh(car.price)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-verified-soft px-2 py-0.5 text-[11px] font-bold text-verified"><Wallet size={11} aria-hidden /> Budget</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
