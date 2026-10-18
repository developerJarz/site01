import { formatKm, formatLakh } from "./utils.ts";

/**
 * Search text generated from a listing's own details. Used whenever the admin hasn't written
 * a custom SEO title, description or photo alt text, so every car page is optimised by default.
 * Safe to import from client components.
 */

type CarLike = {
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  location?: string;
  paperVerified?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  imageAlts?: string[];
};

const CONDITION_WORD: Record<string, string> = { new: "New", used: "Used", reconditioned: "Reconditioned" };
const FUEL_WORD: Record<string, string> = { petrol: "petrol", octane: "octane", diesel: "diesel", cng: "CNG", hybrid: "hybrid", electric: "electric" };

const clean = (s?: string) => (s || "").replace(/\s+/g, " ").trim();

/** Cut at a word boundary so search snippets never end mid-word. */
export function truncate(text: string, max: number) {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** "Dhaka" from "Gulshan, Dhaka" or "Dhaka, Bangladesh": the city buyers search for. */
export function cityOf(location?: string) {
  const parts = clean(location).split(",").map((p) => p.trim()).filter((p) => p && !/^bangladesh$/i.test(p));
  return parts[parts.length - 1] || "Bangladesh";
}

/** "2018 Toyota Axio", falling back to the seller's title when make/model are missing. */
export function carName(car: CarLike) {
  const name = [car.year, clean(car.make), clean(car.model)].filter(Boolean).join(" ");
  return car.make && car.model ? name : clean(car.title) || name || "Car";
}

/** e.g. "Used 2018 Toyota Axio for Sale in Dhaka – ৳ 18.5 Lakh" */
export function autoListingTitle(car: CarLike) {
  const condition = CONDITION_WORD[car.condition || ""] || "";
  const price = car.price ? ` – ${formatLakh(car.price)}` : "";
  return clean(`${condition} ${carName(car)} for Sale in ${cityOf(car.location)}${price}`);
}

export function listingSeoTitle(car: CarLike) {
  return clean(car.seoTitle) || autoListingTitle(car);
}

/** e.g. "Buy this used 2018 Toyota Axio (hybrid, automatic, 45,000 km) in Dhaka for ৳ 18.5 Lakh. Papers verified …" */
export function autoListingDescription(car: CarLike) {
  const specs = [FUEL_WORD[car.fuelType || ""], car.transmission?.replace("-", " "), car.mileage ? formatKm(car.mileage) : ""].filter(Boolean).join(", ");
  const condition = (CONDITION_WORD[car.condition || ""] || "").toLowerCase();
  const lead = `Buy this ${condition} ${carName(car)}${specs ? ` (${specs})` : ""} in ${cityOf(car.location)}${car.price ? ` for ${formatLakh(car.price)}` : ""}.`;
  const trust = car.paperVerified ? " Papers verified by CarHat." : "";
  return truncate(`${clean(lead)}${trust} See photos, specs and contact the seller on CarHat BD.`, 158);
}

export function listingSeoDescription(car: CarLike) {
  return truncate(clean(car.seoDescription) || autoListingDescription(car), 160);
}

/** Alt text for photo `index`: the admin's text if set, otherwise e.g. "White 2018 Toyota Axio for sale in Dhaka, photo 2". */
export function listingImageAlt(car: CarLike, index = 0) {
  const custom = clean(car.imageAlts?.[index]);
  if (custom) return custom;
  const colour = clean(car.color);
  const name = `${colour ? `${colour[0].toUpperCase()}${colour.slice(1)} ` : ""}${carName(car)}`;
  return `${name} for sale in ${cityOf(car.location)}${index > 0 ? `, photo ${index + 1}` : ""}`;
}

/** Facebook, WhatsApp and LinkedIn can't show AVIF previews: ask Cloudinary for a 1200×630 JPEG. */
export function shareImageUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/f_jpg,q_auto:good,w_1200,h_630,c_fill,g_auto/");
  }
  return url;
}
