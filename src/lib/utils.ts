import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Escape user input before putting it inside a RegExp. */
export function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LAKH = 100_000;
const CRORE = 10_000_000;

function trim(n: number, digits: number) {
  return Number(n.toFixed(digits)).toString();
}

/**
 * Car prices in Bangladesh are quoted in lakh and crore.
 * 2_850_000 -> { amount: "28.5", unit: "lakh" }, 12_500_000 -> { amount: "1.25", unit: "crore" }
 */
export function priceParts(price: number | undefined | null) {
  const p = Number(price) || 0;
  if (p >= CRORE) return { amount: trim(p / CRORE, 2), unit: "crore" as const };
  if (p >= LAKH) return { amount: trim(p / LAKH, p >= 10 * LAKH ? 1 : 2), unit: "lakh" as const };
  return { amount: p.toLocaleString("en-IN"), unit: "" as const };
}

/** "৳ 28.5 lakh" */
export function formatLakh(price: number | undefined | null) {
  const { amount, unit } = priceParts(price);
  return `৳ ${amount}${unit ? ` ${unit}` : ""}`;
}

/** "৳ 28,50,000" — South Asian digit grouping, as used on BD price tags. */
export function formatTaka(price: number | undefined | null) {
  return `৳ ${(Number(price) || 0).toLocaleString("en-IN")}`;
}

export function formatKm(km: number | undefined | null) {
  return `${(Number(km) || 0).toLocaleString("en-IN")} km`;
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Base64 photos are swapped for a URL served by /api/listing-image, so pages stay small
 * and the browser (and next/image) can cache and resize them. Normal URLs pass through.
 */
export function listingImageUrl(listingId: unknown, src: string | undefined | null, index = 0) {
  if (!src) return undefined;
  return src.startsWith("data:") ? `/api/listing-image/${String(listingId)}/${index}` : src;
}

/** Replace any inline base64 photos on a listing with served URLs (keeps array order). */
export function withServedImages<T extends { _id: unknown; images?: string[] }>(car: T): T {
  if (!car.images?.length) return car;
  return { ...car, images: car.images.map((src, i) => listingImageUrl(car._id, src, i) as string) };
}

export const FALLBACK_CAR_IMAGE =
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=70&w=800";
