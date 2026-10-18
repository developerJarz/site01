/**
 * Validates what a seller sends when posting a car. Only these fields are copied onto a listing, so
 * a request can't set `featured`, `views`, `status` or `paperVerified` for itself.
 */

export const CONDITIONS = ["new", "used", "reconditioned"] as const;
export const FUEL_TYPES = ["petrol", "diesel", "cng", "hybrid", "electric", "octane"] as const;
export const TRANSMISSIONS = ["manual", "automatic", "semi-automatic"] as const;

export type ListingInput = {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: (typeof CONDITIONS)[number];
  fuelType: (typeof FUEL_TYPES)[number];
  transmission: (typeof TRANSMISSIONS)[number];
  engineSize: number;
  color: string;
  location: string;
  description: string;
  features: string[];
  images: string[];
  documents: string[];
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const number = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);
const oneOf = <T extends readonly string[]>(list: T, v: unknown, fallback: T[number]): T[number] =>
  (list as readonly string[]).includes(v as string) ? (v as T[number]) : fallback;
const strings = (v: unknown, maxItems: number, maxLength: number) =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, maxItems).map((s) => s.slice(0, maxLength)) : [];

/** Returns the clean listing fields, or the first problem found as a message for the seller. */
export function parseListingInput(
  body: Record<string, unknown>,
  { maxImages = 10, now = new Date() }: { maxImages?: number; now?: Date } = {}
): { ok: true; value: ListingInput } | { ok: false; error: string } {
  const make = text(body.make, 60);
  const model = text(body.model, 60);
  if (!make) return { ok: false, error: "Choose the car's make." };
  if (!model) return { ok: false, error: "Enter the car's model." };

  const year = number(body.year);
  if (!Number.isInteger(year) || year < 1950 || year > now.getFullYear() + 1) return { ok: false, error: "Enter a valid model year." };

  const price = number(body.price);
  if (!Number.isFinite(price) || price < 10_000 || price > 1_000_000_000) return { ok: false, error: "Enter a price between ৳10,000 and ৳100 crore." };

  const mileage = number(body.mileage);
  if (!Number.isFinite(mileage) || mileage < 0 || mileage > 2_000_000) return { ok: false, error: "Enter the mileage in kilometres." };

  const engine = number(body.engineSize);
  const engineSize = Number.isFinite(engine) && engine > 0 && engine <= 10_000 ? Math.round(engine) : 1500;

  const description = text(body.description, 5000);
  if (description.length < 20) return { ok: false, error: "Write at least a sentence or two about the car." };

  // Uploaded files live under /uploads; the browser fallback sends data URLs.
  const isMedia = (s: string) => s.startsWith("/uploads/") || s.startsWith("data:image/") || s.startsWith("data:application/pdf") || s.startsWith("https://");
  const images = strings(body.images, maxImages, 8_000_000).filter(isMedia);
  if (images.length === 0) return { ok: false, error: "Add at least one photo of the car." };

  return {
    ok: true,
    value: {
      make,
      model,
      year,
      price: Math.round(price),
      mileage: Math.round(mileage),
      condition: oneOf(CONDITIONS, body.condition, "used"),
      fuelType: oneOf(FUEL_TYPES, body.fuelType, "petrol"),
      transmission: oneOf(TRANSMISSIONS, body.transmission, "automatic"),
      engineSize,
      color: text(body.color, 40) || "Not specified",
      location: text(body.location, 120) || "Dhaka",
      description,
      features: strings(body.features, 30, 60),
      images,
      documents: strings(body.documents, 5, 8_000_000).filter(isMedia),
    },
  };
}
