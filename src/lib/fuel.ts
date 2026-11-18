/**
 * A car can run on more than one fuel (Octane + CNG is common in Bangladesh). Listings keep every
 * fuel in `fuelTypes`, and `fuelType` holds the first one so older code, filters and reports work.
 */

export const FUEL_TYPES = ["petrol", "diesel", "cng", "hybrid", "electric", "octane"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_LABEL: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", cng: "CNG", hybrid: "Hybrid", electric: "Electric", octane: "Octane" };

export type FuelLike = { fuelType?: string | null; fuelTypes?: string[] | null };

/** Every fuel a listing runs on, primary first. Older listings only have `fuelType`. */
export function listingFuels(car: FuelLike): string[] {
  const list = Array.isArray(car.fuelTypes) ? car.fuelTypes.filter(Boolean) : [];
  if (list.length) return [...new Set(list)];
  return car.fuelType ? [car.fuelType] : [];
}

/** "Octane + CNG" for display, or "" when the listing has no fuel. */
export function fuelLabel(car: FuelLike, labels: Record<string, string> = FUEL_LABEL) {
  return listingFuels(car).map((f) => labels[f] || f).join(" + ");
}

/** Clean list of known fuels from a request: `fuelTypes` array, else the single `fuelType`. */
export function parseFuelTypes(body: { fuelTypes?: unknown; fuelType?: unknown }, fallback: FuelType = "petrol"): FuelType[] {
  const raw = Array.isArray(body.fuelTypes) ? body.fuelTypes : body.fuelType !== undefined ? [body.fuelType] : [];
  const known = raw.filter((f): f is FuelType => (FUEL_TYPES as readonly string[]).includes(f as string));
  const unique = [...new Set(known)];
  return unique.length ? unique : [fallback];
}

/** Mongo clause matching listings that run on any of `fuels`, old single-fuel listings included. */
export function fuelMatch(fuels: string[]) {
  return { $or: [{ fuelTypes: { $in: fuels } }, { fuelType: { $in: fuels } }] };
}
