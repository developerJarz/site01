const BODY_MODELS: Record<string, RegExp> = {
  suv: /^(?:Harrier|Corolla Cross|RAV4|Land Cruiser|Prado|Vezel|CR-V|HR-V|CX[- ]?[3589]|X-Trail|Qashqai|Juke|Pajero|Outlander|Tucson|Santa Fe|Sportage|Sorento|Tiguan|Touareg|X[1-7]|RX|NX|UX|Q[2-8]|GL[ABCEKS])\b/i,
  sedan: /^(?:Axio|Corolla(?! Cross)|Premio|Allion|Camry|Civic|Accord|Insight|Grace|City|Sylphy|Teana|Lancer|Elantra|Sonata|[357] Series|[CES]-Class|A[468]|IS|ES|LS)\b/i,
  hatchback: /^(?:Aqua|Vitz|Yaris|Fit|Jazz|Note|March|Swift|Demio|Mazda ?2|Golf|Polo|Leaf|i[12]0|Picanto)\b/i,
  mpv: /^(?:Noah|Voxy|Esquire|Alphard|Vellfire|Serena|Freed|Stepw[ag]+n|Odyssey|Wish|Sienta|Elgrand|Ertiga)\b/i,
  pickup: /^(?:Hilux|Navara|Ranger|L200|Triton|D-Max|BT-50|Amarok)\b/i,
};

function literal(value: string, exact = false) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(exact ? `^${escaped}$` : escaped, "i");
}

function price(value: string | null, field: string) {
  if (!value?.trim()) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new RangeError(`${field} must be a valid positive price.`);
  return number;
}

/** Extend the existing filters without changing their defaults or the active-only restriction. */
export function buildListingQuery(params: URLSearchParams): Record<string, unknown> {
  const query: Record<string, unknown> = { status: "active" };
  const clauses: Record<string, unknown>[] = [];
  const text = params.get("q")?.trim().slice(0, 120);
  if (text) {
    const rx = literal(text);
    clauses.push({ $or: [{ make: rx }, { model: rx }, { title: rx }, { location: rx }] });
  }
  for (const field of ["make", "model"] as const) {
    const value = params.get(field)?.trim().slice(0, 100);
    if (value) query[field] = literal(value, true);
  }
  const location = params.get("location")?.trim().slice(0, 100);
  if (location) query.location = literal(location);
  for (const field of ["condition", "fuelType", "transmission"] as const) {
    const value = params.get(field)?.trim();
    if (value) query[field] = value;
  }
  if (params.get("verified") === "1") query.paperVerified = true;
  // One seller's or dealer's stock; only a well-formed ObjectId reaches the query.
  const seller = params.get("seller")?.trim();
  if (seller && /^[a-f0-9]{24}$/i.test(seller)) query.sellerId = seller;
  const rawYear = params.get("year");
  if (rawYear?.trim()) {
    const year = Number(rawYear);
    if (!Number.isInteger(year) || year < 1886 || year > new Date().getFullYear() + 1) {
      throw new RangeError("Choose a valid model year.");
    }
    query.year = year;
  }
  const minimum = price(params.get("minPrice"), "Minimum price");
  const maximum = price(params.get("maxPrice"), "Maximum price");
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    throw new RangeError("Minimum price cannot exceed maximum price.");
  }
  if (minimum !== undefined || maximum !== undefined) {
    query.price = {
      ...(minimum !== undefined ? { $gte: minimum } : {}),
      ...(maximum !== undefined ? { $lte: maximum } : {}),
    };
  }
  const category = params.get("category")?.toLowerCase();
  if (category === "hybrid" || category === "electric") {
    // Keep an explicitly selected fuel constraint when it conflicts with a category.
    if (query.fuelType && query.fuelType !== category) clauses.push({ fuelType: category });
    else query.fuelType = category;
  } else if (category === "luxury") {
    clauses.push({ make: /^(?:BMW|Mercedes(?:-Benz)?|Audi|Lexus|Porsche|Bentley|Land Rover|Jaguar|Rolls-Royce)$/i });
  } else if (category && BODY_MODELS[category]) {
    // Legacy listings have no bodyType. Known models keep category browsing useful without
    // rewriting sellers' records; an explicit bodyType always takes precedence.
    clauses.push({ $or: [
      { bodyType: category },
      { bodyType: { $in: [null, ""] }, model: BODY_MODELS[category] },
    ] });
  }
  if (clauses.length) query.$and = clauses;
  return query;
}
