import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { CarImage } from "./CarImage";
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
  featured?: boolean;
  paperVerified?: boolean;
}

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  used: "Used",
  reconditioned: "Reconditioned",
};

const CONDITION_CLASS: Record<string, string> = {
  new: "badge-new",
  used: "badge-used",
  reconditioned: "badge-reconditioned",
};

const FUEL_LABEL: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
  hybrid: "Hybrid",
  electric: "Electric",
  octane: "Octane",
};

const TRANSMISSION_LABEL: Record<string, string> = {
  automatic: "Auto",
  manual: "Manual",
  "semi-automatic": "Semi-auto",
};

export function Price({ value, className, size = "md" }: { value: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const { amount, unit } = priceParts(value);
  // Sizes are set on the line and the ৳ / unit scale from it (em), so the currency sign never
  // shrinks below legibility. Archivo has no ৳ glyph; it falls back to the system Bengali font.
  return (
    <p
      className={cn(
        "price-tag leading-none text-foreground",
        size === "lg" ? "text-4xl md:text-5xl" : size === "sm" ? "text-xl" : "text-2xl",
        className
      )}
      title={formatTaka(value)}
    >
      <span className="mr-[0.15em] text-[0.85em]" aria-hidden>৳</span>
      <span aria-hidden>{amount}</span>
      {unit && (
        <span className="ml-[0.3em] text-[0.55em] font-semibold text-muted-foreground" style={{ fontStretch: "100%" }} aria-hidden>
          {unit}
        </span>
      )}
      <span className="sr-only">{formatTaka(value)}</span>
    </p>
  );
}

export function CarCard({
  car,
  priority,
  sizes = "(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 92vw",
}: {
  car: CarCardData;
  priority?: boolean;
  sizes?: string;
}) {
  const specs = [
    car.mileage !== undefined ? formatKm(car.mileage) : null,
    car.fuelType ? FUEL_LABEL[car.fuelType] || car.fuelType : null,
    car.transmission ? TRANSMISSION_LABEL[car.transmission] || car.transmission : null,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/cars/${car.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <CarImage
          src={car.images?.[0]}
          alt={car.title}
          sizes={sizes}
          priority={priority}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          <div className="flex flex-col items-start gap-1.5">
            {car.paperVerified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-verified px-2 py-1 text-xs font-semibold text-white shadow-sm">
                <ShieldCheck size={13} aria-hidden /> Paper Verified
              </span>
            )}
            {car.featured && (
              <span className="rounded-md bg-marigold px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
                Featured
              </span>
            )}
          </div>
          {car.condition && (
            <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", CONDITION_CLASS[car.condition] || "badge-used")}>
              {CONDITION_LABEL[car.condition] || car.condition}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-grow flex-col p-4">
        <p className="text-sm font-medium text-muted-foreground">
          {[car.year, car.make].filter(Boolean).join(" ")}
        </p>
        <h3 className="mt-0.5 line-clamp-1 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
          {car.title}
        </h3>
        <Price value={car.price} className="mt-3" />

        <div className="mt-auto pt-4">
          {specs.length > 0 && (
            <ul className="flex items-center divide-x divide-border border-t border-border pt-3 text-sm text-muted-foreground">
              {specs.map((s) => (
                <li key={s} className="truncate px-2.5 first:pl-0 last:pr-0">
                  {s}
                </li>
              ))}
            </ul>
          )}
          {car.location && (
            <p className="mt-2 flex items-center gap-1 truncate text-sm text-muted-foreground">
              <MapPin size={14} className="shrink-0 text-teal-ink" aria-hidden /> {car.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3.5 w-1/3 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-7 w-1/2 rounded" />
        <div className="skeleton h-3.5 w-full rounded" />
      </div>
    </div>
  );
}
