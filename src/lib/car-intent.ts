/**
 * Turns a shopper's sentence ("SUV under 40 lakh in Dhaka") into the filters /api/listings/search
 * understands. Deterministic and local: no model call, so it is instant and never invents cars.
 */

const LAKH = 100_000;
const CRORE = 10_000_000;

const CATEGORY_WORDS: [RegExp, string][] = [
  [/\b(?:suvs?|crossovers?|jeeps?)\b/, "suv"],
  [/\bsedans?\b|\bsaloons?\b/, "sedan"],
  [/\bhatch(?:back)?s?\b/, "hatchback"],
  [/\b(?:mpvs?|micro(?:bus)?s?|minivans?|family\s+(?:car|van)|7[- ]?seat(?:er)?s?|seven[- ]seat(?:er)?s?)\b/, "mpv"],
  [/\b(?:pick-?ups?|double\s+cabin)\b/, "pickup"],
  [/\bluxury\b|\bpremium\b/, "luxury"],
  [/\b(?:electric|ev|evs)\b/, "electric"],
  [/\bhybrids?\b/, "hybrid"],
];

const FUEL_WORDS: [RegExp, string][] = [
  [/\bdiesel\b/, "diesel"],
  [/\boctane\b/, "octane"],
  [/\bpetrol\b/, "petrol"],
  [/\bcng\b/, "cng"],
];

const MAKES = ["Toyota", "Honda", "Nissan", "Mitsubishi", "Hyundai", "Kia", "Mazda", "Suzuki", "BMW", "Mercedes-Benz", "Audi", "Lexus", "Volkswagen", "Land Rover", "Porsche", "Tesla", "Ford", "Subaru"];
const MAKE_ALIASES: Record<string, string> = { mercedes: "Mercedes-Benz", benz: "Mercedes-Benz", vw: "Volkswagen" };
const CITIES = ["Dhaka", "Chattogram", "Chittagong", "Gazipur", "Narayanganj", "Sylhet", "Khulna", "Rajshahi", "Cumilla", "Comilla", "Barishal", "Rangpur", "Mymensingh", "Bogura"];
const CITY_ALIASES: Record<string, string> = { chittagong: "Chattogram", comilla: "Cumilla" };

export interface CarIntent {
  category?: string;
  fuelType?: string;
  make?: string;
  location?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
}

function amount(value: string, unit: string | undefined, fallbackUnit: string | undefined) {
  const n = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(n)) return undefined;
  const u = (unit || fallbackUnit || "").toLowerCase();
  if (u.startsWith("cr")) return Math.round(n * CRORE);
  if (u.startsWith("l")) return Math.round(n * LAKH);
  if (u === "k") return Math.round(n * 1000);
  // A bare number below 1,000 is almost always lakh in a car budget ("under 40").
  return n < 1000 ? Math.round(n * LAKH) : Math.round(n);
}

const UNIT = "(lakh|lac|lacs|lakhs|l|crore|crores|cr|k)?";
const NUM = "(\\d+(?:[.,]\\d+)?)";

export function parseCarIntent(input: string): CarIntent {
  const text = input.toLowerCase().slice(0, 300);
  const intent: CarIntent = {};

  for (const [rx, key] of CATEGORY_WORDS) if (rx.test(text)) { intent.category = key; break; }
  for (const [rx, fuel] of FUEL_WORDS) if (rx.test(text)) { intent.fuelType = fuel; break; }

  for (const [alias, make] of Object.entries(MAKE_ALIASES)) if (new RegExp(`\\b${alias}\\b`).test(text)) intent.make = make;
  for (const make of MAKES) if (new RegExp(`\\b${make.toLowerCase().replace("-", "[- ]?")}\\b`).test(text)) intent.make = make;

  for (const city of CITIES) {
    if (new RegExp(`\\b${city.toLowerCase()}\\b`).test(text)) { intent.location = CITY_ALIASES[city.toLowerCase()] || city; break; }
  }

  if (/\b(?:auto|automatic)\b/.test(text)) intent.transmission = "automatic";
  else if (/\bmanual\b/.test(text)) intent.transmission = "manual";

  const between = text.match(new RegExp(`(?:between|from)\\s*${NUM}\\s*${UNIT}\\s*(?:and|to|-)\\s*${NUM}\\s*${UNIT}`));
  const range = between ?? text.match(new RegExp(`${NUM}\\s*${UNIT}\\s*(?:-|to)\\s*${NUM}\\s*${UNIT}`));
  if (range) {
    intent.minPrice = amount(range[1], range[2], range[4]);
    intent.maxPrice = amount(range[3], range[4], range[2]);
  } else {
    const max = text.match(new RegExp(`(?:under|below|less than|within|max(?:imum)?|up to|upto|budget(?: of| is)?|<)\\s*(?:tk\\.?|৳|bdt)?\\s*${NUM}\\s*${UNIT}`));
    const min = text.match(new RegExp(`(?:over|above|more than|at least|min(?:imum)?|>)\\s*(?:tk\\.?|৳|bdt)?\\s*${NUM}\\s*${UNIT}`));
    if (max) intent.maxPrice = amount(max[1], max[2], undefined);
    if (min) intent.minPrice = amount(min[1], min[2], undefined);
    if (!max && !min) {
      const around = text.match(new RegExp(`${NUM}\\s*(lakh|lac|lacs|lakhs|crore|crores|cr)\\b`));
      // "around 30 lakh": a band either side.
      if (around) {
        const centre = amount(around[1], around[2], undefined)!;
        intent.minPrice = Math.round(centre * 0.85);
        intent.maxPrice = Math.round(centre * 1.15);
      }
    }
  }
  if (intent.minPrice !== undefined && intent.maxPrice !== undefined && intent.minPrice > intent.maxPrice) {
    [intent.minPrice, intent.maxPrice] = [intent.maxPrice, intent.minPrice];
  }
  return intent;
}

export function intentToParams(intent: CarIntent): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(intent)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params;
}

export function describeIntent(intent: CarIntent): string {
  const lakh = (n: number) => (n >= CRORE ? `${Number((n / CRORE).toFixed(2))} crore` : `${Number((n / LAKH).toFixed(1))} lakh`);
  const parts: string[] = [];
  const kind = { suv: "SUVs", sedan: "sedans", hatchback: "hatchbacks", mpv: "family MPVs", pickup: "pickups", luxury: "luxury cars", electric: "electric cars", hybrid: "hybrids" }[intent.category || ""];
  parts.push([intent.make, kind || "cars"].filter(Boolean).join(" "));
  if (intent.fuelType) parts.push(`running on ${intent.fuelType}`);
  if (intent.transmission) parts.push(`with ${intent.transmission} gearbox`);
  if (intent.minPrice !== undefined && intent.maxPrice !== undefined) parts.push(`between ${lakh(intent.minPrice)} and ${lakh(intent.maxPrice)}`);
  else if (intent.maxPrice !== undefined) parts.push(`under ${lakh(intent.maxPrice)}`);
  else if (intent.minPrice !== undefined) parts.push(`above ${lakh(intent.minPrice)}`);
  if (intent.location) parts.push(`in ${intent.location}`);
  return parts.join(" ");
}
