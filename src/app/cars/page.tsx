"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ShieldCheck } from "lucide-react";
import { CarCard, CarCardSkeleton, type CarCardData } from "@/components/CarCard";
import { cn, formatLakh } from "@/lib/utils";

const MAKES = [
  "Audi", "BMW", "Honda", "Hyundai", "Kia", "Lexus", "Mazda", "Mercedes-Benz",
  "Mitsubishi", "Nissan", "Suzuki", "Toyota", "Volkswagen",
];

const CONDITIONS = [
  { value: "", label: "Any" },
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "reconditioned", label: "Recon" },
];

const FUELS = [
  { value: "petrol", label: "Petrol" },
  { value: "octane", label: "Octane" },
  { value: "hybrid", label: "Hybrid" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
];

const TRANSMISSIONS = [
  { value: "", label: "Any" },
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
];

const BUDGETS = [
  { label: "Under 10 lakh", min: "", max: "1000000" },
  { label: "10–20 lakh", min: "1000000", max: "2000000" },
  { label: "20–40 lakh", min: "2000000", max: "4000000" },
  { label: "40 lakh–1 crore", min: "4000000", max: "10000000" },
  { label: "1 crore+", min: "10000000", max: "" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "year-new", label: "Year: newest" },
  { value: "mileage-low", label: "Lowest mileage" },
  { value: "popular", label: "Most viewed" },
];

const FILTER_KEYS = ["q", "make", "condition", "fuelType", "transmission", "minPrice", "maxPrice", "location", "verified"] as const;

export default function CarsPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <CarsContent />
    </Suspense>
  );
}

function CarsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<CarCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // The URL is the single source of truth for filters, so results are shareable and survive refresh.
  const queryString = searchParams.toString();
  const get = useCallback((k: string) => searchParams.get(k) || "", [searchParams]);

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/listings/search?${queryString}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => setListings(data.listings || []))
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [queryString, attempt]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: Record<string, string> }[] = [];
    if (get("q")) chips.push({ key: "q", label: `“${get("q")}”`, clear: { q: "" } });
    if (get("make")) chips.push({ key: "make", label: get("make"), clear: { make: "" } });
    if (get("condition")) chips.push({ key: "condition", label: CONDITIONS.find((c) => c.value === get("condition"))?.label || get("condition"), clear: { condition: "" } });
    if (get("fuelType")) chips.push({ key: "fuelType", label: FUELS.find((f) => f.value === get("fuelType"))?.label || get("fuelType"), clear: { fuelType: "" } });
    if (get("transmission")) chips.push({ key: "transmission", label: TRANSMISSIONS.find((t) => t.value === get("transmission"))?.label || get("transmission"), clear: { transmission: "" } });
    if (get("minPrice") || get("maxPrice")) {
      const min = get("minPrice"), max = get("maxPrice");
      const label = min && max ? `${formatLakh(+min)} – ${formatLakh(+max)}` : min ? `From ${formatLakh(+min)}` : `Up to ${formatLakh(+max)}`;
      chips.push({ key: "price", label, clear: { minPrice: "", maxPrice: "" } });
    }
    if (get("location")) chips.push({ key: "location", label: get("location"), clear: { location: "" } });
    if (get("verified") === "1") chips.push({ key: "verified", label: "Paper Verified", clear: { verified: "" } });
    return chips;
  }, [get]);

  const clearAll = () => {
    const reset: Record<string, string> = {};
    for (const k of FILTER_KEYS) reset[k] = "";
    setParams(reset);
  };

  const heading = get("make") ? `${get("make")} cars for sale` : get("verified") === "1" ? "Cars with checked papers" : "Cars for sale";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-primary">Home</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-foreground">Cars</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-semiwide text-3xl font-extrabold md:text-4xl">{heading}</h1>
          <p className="mt-1 text-muted-foreground" aria-live="polite">
            {loading ? "Finding cars…" : `${listings.length.toLocaleString("en-IN")} ${listings.length === 1 ? "car" : "cars"}${listings.length >= 120 ? "+" : ""}`}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex grow items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold lg:hidden"
          >
            <SlidersHorizontal size={16} aria-hidden /> Filters
            {activeChips.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs font-bold text-white tabular">{activeChips.length}</span>
            )}
          </button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select
            id="sort"
            value={get("sort") || "newest"}
            onChange={(e) => setParams({ sort: e.target.value === "newest" ? "" : e.target.value })}
            className="grow rounded-lg border border-input bg-card px-3 py-2.5 text-sm font-semibold sm:grow-0"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setParams(chip.clear)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#bcd0ee] bg-[#e6eefa] py-1 pl-3 pr-2 text-sm font-medium text-primary hover:border-primary"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label} <X size={14} aria-hidden />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
            <Filters get={get} setParams={setParams} />
          </div>
        </aside>

        <section aria-label="Results">
          {error ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center">
              <p className="font-semibold">Couldn&apos;t load cars.</p>
              <p className="mt-1 text-muted-foreground">Check your connection and try again.</p>
              <button onClick={() => setAttempt((n) => n + 1)} className="mt-4 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white">
                Try again
              </button>
            </div>
          ) : loading && listings.length === 0 ? (
            <ResultsGrid>
              {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
            </ResultsGrid>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-input bg-card p-10 text-center">
              <p className="text-lg font-semibold">No cars match these filters</p>
              <p className="mx-auto mt-1 max-w-md text-muted-foreground">
                Remove a filter or widen your budget. New cars are listed every day.
              </p>
              <button onClick={clearAll} className="mt-5 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white">
                Clear all filters
              </button>
            </div>
          ) : (
            <ResultsGrid className={cn("transition-opacity duration-150", loading && "opacity-60")}>
              {listings.map((car, i) => (
                <CarCard key={car._id} car={car} priority={i < 3} sizes="(min-width: 1280px) 19rem, (min-width: 640px) 45vw, 92vw" />
              ))}
            </ResultsGrid>
          )}
        </section>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="animate-fade absolute inset-0 bg-ink-deep/60" onClick={() => setSheetOpen(false)} />
          <div className="animate-sheet-up absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl bg-card shadow-pop">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setSheetOpen(false)} className="rounded-lg p-2 hover:bg-muted" aria-label="Close filters">
                <X size={22} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
              <Filters get={get} setParams={setParams} />
            </div>
            <div className="flex gap-3 border-t border-border p-4">
              <button onClick={clearAll} className="rounded-lg border border-border px-5 py-3 font-semibold">
                Clear
              </button>
              <button onClick={() => setSheetOpen(false)} className="grow rounded-lg bg-primary py-3 font-semibold text-white">
                {loading ? "Show cars" : `Show ${listings.length} ${listings.length === 1 ? "car" : "cars"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

function ResultsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="skeleton h-9 w-64 rounded" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

/** Text input that writes to the URL after the person pauses typing. */
function DebouncedInput({
  value,
  onCommit,
  ...props
}: { value: string; onCommit: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === committed.current) return;
    const t = setTimeout(() => {
      committed.current = draft;
      onCommit(draft);
    }, 400);
    return () => clearTimeout(t);
  }, [draft, onCommit]);

  return <input {...props} value={draft} onChange={(e) => setDraft(e.target.value)} />;
}

const fieldClass =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-[15px] placeholder:text-muted-foreground";

function Filters({ get, setParams }: { get: (k: string) => string; setParams: (u: Record<string, string>) => void }) {
  const commitQ = useCallback((v: string) => setParams({ q: v.trim() }), [setParams]);
  const commitLocation = useCallback((v: string) => setParams({ location: v.trim() }), [setParams]);
  const commitMin = useCallback((v: string) => setParams({ minPrice: v ? String(Math.round(Number(v) * 100000)) : "" }), [setParams]);
  const commitMax = useCallback((v: string) => setParams({ maxPrice: v ? String(Math.round(Number(v) * 100000)) : "" }), [setParams]);
  const toLakh = (v: string) => (v ? String(Number(v) / 100000) : "");

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="f-q" className="mb-2 block text-sm font-semibold">Keyword</label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <DebouncedInput id="f-q" type="search" value={get("q")} onCommit={commitQ} placeholder="Axio, Premio, Noah…" className={cn(fieldClass, "pl-9")} />
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={get("verified") === "1"}
        onClick={() => setParams({ verified: get("verified") === "1" ? "" : "1" })}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
          get("verified") === "1" ? "border-verified bg-[#e3f5ec]" : "border-border hover:bg-muted"
        )}
      >
        <ShieldCheck size={20} className="shrink-0 text-verified" aria-hidden />
        <span className="grow text-sm font-semibold">Paper Verified only</span>
        <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", get("verified") === "1" ? "bg-verified" : "bg-input")}>
          <span className={cn("absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", get("verified") === "1" && "translate-x-4")} />
        </span>
      </button>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Budget</legend>
        <div className="flex flex-wrap gap-1.5">
          {BUDGETS.map((b) => {
            const on = get("minPrice") === b.min && get("maxPrice") === b.max;
            return (
              <button
                key={b.label}
                type="button"
                aria-pressed={on}
                onClick={() => setParams(on ? { minPrice: "", maxPrice: "" } : { minPrice: b.min, maxPrice: b.max })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  on ? "border-primary bg-primary text-white" : "border-border hover:border-primary"
                )}
              >
                {b.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor="f-min">Minimum price in lakh</label>
          <DebouncedInput id="f-min" type="number" inputMode="decimal" min={0} value={toLakh(get("minPrice"))} onCommit={commitMin} placeholder="Min" className={fieldClass} />
          <span className="text-muted-foreground" aria-hidden>–</span>
          <label className="sr-only" htmlFor="f-max">Maximum price in lakh</label>
          <DebouncedInput id="f-max" type="number" inputMode="decimal" min={0} value={toLakh(get("maxPrice"))} onCommit={commitMax} placeholder="Max" className={fieldClass} />
          <span className="shrink-0 text-sm text-muted-foreground">lakh</span>
        </div>
      </fieldset>

      <div>
        <label htmlFor="f-make" className="mb-2 block text-sm font-semibold">Make</label>
        <select id="f-make" value={get("make")} onChange={(e) => setParams({ make: e.target.value })} className={fieldClass}>
          <option value="">All makes</option>
          {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <Segmented legend="Condition" options={CONDITIONS} value={get("condition")} onChange={(v) => setParams({ condition: v })} />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Fuel</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {FUELS.map((f) => {
            const on = get("fuelType") === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => setParams({ fuelType: on ? "" : f.value })}
                className={cn(
                  "rounded-lg border py-2 text-sm font-medium transition-colors",
                  on ? "border-primary bg-primary text-white" : "border-border hover:border-primary"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Segmented legend="Transmission" options={TRANSMISSIONS} value={get("transmission")} onChange={(v) => setParams({ transmission: v })} />

      <div>
        <label htmlFor="f-loc" className="mb-2 block text-sm font-semibold">City or area</label>
        <DebouncedInput id="f-loc" type="text" value={get("location")} onCommit={commitLocation} placeholder="Dhaka, Gulshan, Chattogram…" className={fieldClass} />
      </div>
    </div>
  );
}

function Segmented({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex rounded-lg bg-muted p-1">
        {options.map((o) => (
          <button
            key={o.value || "any"}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "grow rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
              value === o.value ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
