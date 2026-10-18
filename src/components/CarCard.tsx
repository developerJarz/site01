"use client";

import Link from "next/link";
import { listingImageAlt } from "@/lib/seo-text";
import { useSession } from "next-auth/react";
import { ArrowRight, BadgeCheck, Check, Flame, Fuel, Gauge, GitCompareArrows, Heart, MapPin, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { Badge } from "@/components/ui/badge";
import { useMarketplace } from "@/context/MarketplaceContext";
import { cn, formatKm, formatTaka, priceParts } from "@/lib/utils";

export interface CarCardData {
  _id: string;
  slug: string;
  title: string;
  price: number;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  condition?: string;
  location?: string;
  images?: string[];
  /** Admin-written alt text for the photos; generated from the car details when empty. */
  imageAlts?: string[];
  color?: string;
  featured?: boolean;
  paperVerified?: boolean;
  status?: string;
  /** Set by the page loader when the car sits well below the market average for its model. */
  hotDeal?: boolean;
  seller?: {
    name: string;
    role?: string;
    isVerified?: boolean;
    dealershipName?: string;
  };
}

export const FUEL_LABEL: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", cng: "CNG", hybrid: "Hybrid", electric: "Electric", octane: "Octane" };
export const GEAR_LABEL: Record<string, string> = { automatic: "Automatic", manual: "Manual", "semi-automatic": "Semi-auto" };
export const CONDITION_LABEL: Record<string, string> = { new: "New", used: "Used", reconditioned: "Reconditioned" };

/** "৳ 28.5 lakh", with the currency sign and unit scaled from the line size so they never shrink below legibility. */
export function Price({ value, className, size = "md" }: { value: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const { amount, unit } = priceParts(value);
  return (
    <p
      className={cn(
        "price-tag leading-none text-night",
        size === "lg" ? "text-4xl md:text-[2.75rem]" : size === "sm" ? "text-xl" : "text-2xl",
        className
      )}
      title={formatTaka(value)}
    >
      <span className="mr-[0.15em] text-[0.85em]" aria-hidden>৳</span>
      <span aria-hidden>{amount}</span>
      {unit && <span className="ml-[0.3em] text-[0.55em] font-semibold text-slate-text" aria-hidden>{unit}</span>}
      <span className="sr-only">{formatTaka(value)}</span>
    </p>
  );
}

export function CarCard({ car, priority, sizes }: { car: CarCardData; priority?: boolean; sizes?: string }) {
  const { favoriteIds, pendingIds, toggleFavorite, compareCars, toggleCompare } = useMarketplace();
  const { status } = useSession();
  const saved = favoriteIds.includes(car._id);
  const comparing = compareCars.some((c) => c._id === car._id);
  const seller = car.seller?.dealershipName || car.seller?.name;
  const isDealer = car.seller?.role === "dealer" || !!car.seller?.dealershipName;
  const name = car.make && car.model ? `${car.make} ${car.model}${car.year ? ` ${car.year}` : ""}` : car.title;
  const sold = car.status === "sold";

  const specs = [
    { icon: Gauge, label: "Mileage", value: car.mileage !== undefined ? formatKm(car.mileage) : "—" },
    { icon: Fuel, label: "Fuel", value: car.fuelType ? FUEL_LABEL[car.fuelType] || car.fuelType : "—" },
    { icon: Settings2, label: "Transmission", value: car.transmission ? GEAR_LABEL[car.transmission] || car.transmission : "—" },
  ];

  return (
    <article data-listing-id={car._id} className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-electric/20 hover:shadow-float motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        <Link href={`/cars/${car.slug}`} tabIndex={-1} aria-hidden className="absolute inset-0">
          <CarImage src={car.images?.[0]} alt={listingImageAlt(car)} priority={priority}
            sizes={sizes || "(min-width: 1280px) 300px, (min-width: 1024px) 23vw, (min-width: 640px) 45vw, 80vw"}
            className={cn("transition-transform duration-700 ease-out group-hover/card:scale-110 motion-reduce:group-hover/card:scale-100", sold && "grayscale-[60%]")} />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-night/25 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5 pr-14">
          {car.paperVerified && <Badge variant="verified"><ShieldCheck aria-hidden /> Verified</Badge>}
          {car.featured && <Badge><Sparkles aria-hidden /> Featured</Badge>}
          {car.hotDeal && <Badge variant="hot"><Flame aria-hidden /> Hot Deal</Badge>}
        </div>
        <button type="button" onClick={() => void toggleFavorite(car._id)} disabled={status === "loading" || pendingIds.includes(car._id)}
          aria-label={`${saved ? "Remove" : "Save"} ${car.title} ${saved ? "from" : "to"} wishlist`} aria-pressed={saved}
          className={cn("absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-110 disabled:opacity-60 motion-reduce:hover:scale-100",
            saved ? "text-[#ff3b5c]" : "text-night")}>
          <Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden />
        </button>
        {sold && <span className="absolute bottom-3 left-3 rounded-full bg-night px-2.5 py-1 text-xs font-semibold text-white">Sold</span>}
      </div>

      <div className="flex grow flex-col p-5">
        <h3 className="line-clamp-1 text-[17px] font-bold text-night">
          <Link href={`/cars/${car.slug}`} className="hover:text-electric">{name}</Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-slate-text">
          <MapPin size={13} className="shrink-0" aria-hidden />
          <span className="truncate">{car.location || "Bangladesh"}</span>
          {car.condition && <><span aria-hidden>·</span><span className="shrink-0 font-semibold text-night">{CONDITION_LABEL[car.condition] || car.condition}</span></>}
        </p>
        <Price value={car.price} className="mt-3 text-[1.6rem] !text-electric" />

        <ul className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-mist p-3">
          {specs.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex min-w-0 flex-col items-center gap-1 text-center">
              <Icon size={16} className="text-electric" aria-hidden />
              <span className="sr-only">{label}:</span>
              <span className="w-full truncate text-xs font-semibold text-night">{value}</span>
            </li>
          ))}
        </ul>

        {seller && (
          <div className="mt-4 flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric to-electric-light text-xs font-bold text-white" aria-hidden>
              {seller[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 grow">
              <span className="flex items-center gap-1 text-[13px] font-semibold text-night">
                <span className="truncate">{seller}</span>
                {car.seller?.isVerified && <BadgeCheck size={15} className="shrink-0 text-electric" aria-label="Verified seller" />}
              </span>
              <span className="block text-xs text-slate-text">{isDealer ? "Dealer" : "Private seller"}</span>
            </span>
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-5">
          <Link href={`/cars/${car.slug}`} className="flex h-11 grow items-center justify-center gap-1.5 rounded-xl bg-night text-sm font-semibold text-white transition-colors hover:bg-electric">
            View Details <ArrowRight size={16} aria-hidden />
          </Link>
          <button type="button" onClick={() => toggleCompare(car)} aria-pressed={comparing}
            aria-label={comparing ? `Remove ${car.title} from comparison` : `Compare ${car.title}`}
            className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
              comparing ? "border-electric bg-haze text-electric" : "border-hairline text-slate-text hover:border-electric/40 hover:text-electric")}>
            {comparing ? <Check size={18} aria-hidden /> : <GitCompareArrows size={18} aria-hidden />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-white">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3.5 w-1/3 rounded" />
        <div className="skeleton h-7 w-1/2 rounded" />
        <div className="skeleton h-14 w-full rounded-2xl" />
        <div className="skeleton h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
