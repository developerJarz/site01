"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SearchX, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { CarCard, CarCardSkeleton, type CarCardData } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CONTAINER, EmptyState, PageHero } from "@/components/ui/page";
import { BRANDS, BUDGETS, CATEGORIES, CONDITIONS, FUELS, MORE_MAKES, TRANSMISSIONS } from "@/components/home/data";
import { cn, formatLakh } from "@/lib/utils";

const MAKES = [...new Set([...BRANDS.map((b) => b.name), ...MORE_MAKES])].sort((a, b) => a.localeCompare(b));
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() + 1 - i));

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "year-new", label: "Year: newest" },
  { value: "mileage-low", label: "Lowest mileage" },
  { value: "popular", label: "Most viewed" },
];

const FILTER_KEYS = ["q", "make", "model", "year", "category", "condition", "fuelType", "transmission", "minPrice", "maxPrice", "location", "verified", "seller"] as const;

type SearchResponse = { listings: CarCardData[]; total: number; page: number; pages: number };

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
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

  const fetchPage = useCallback(async (n: number, signal?: AbortSignal) => {
    const res = await fetch(`/api/listings/search?${queryString}${queryString ? "&" : ""}page=${n}`, { signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Couldn't load cars.");
    return data as SearchResponse;
  }, [queryString]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchPage(1, controller.signal)
      .then((data) => {
        setListings(data.listings || []);
        setTotal(data.total || 0);
        setPage(1);
        setPages(data.pages || 1);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [fetchPage, attempt]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchPage(page + 1);
      setListings((cars) => [...cars, ...data.listings.filter((c) => !cars.some((x) => x._id === c._id))]);
      setPage(data.page);
      setPages(data.pages);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const sellerName = get("seller") ? listings[0]?.seller?.dealershipName || listings[0]?.seller?.name : undefined;

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: Record<string, string> }[] = [];
    if (get("q")) chips.push({ key: "q", label: `“${get("q")}”`, clear: { q: "" } });
    if (get("category")) chips.push({ key: "category", label: CATEGORIES.find((c) => c.key === get("category"))?.label || get("category"), clear: { category: "" } });
    if (get("make")) chips.push({ key: "make", label: get("make"), clear: { make: "" } });
    if (get("model")) chips.push({ key: "model", label: get("model"), clear: { model: "" } });
    if (get("year")) chips.push({ key: "year", label: get("year"), clear: { year: "" } });
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
    if (get("seller")) chips.push({ key: "seller", label: sellerName ? `Sold by ${sellerName}` : "One seller", clear: { seller: "" } });
    return chips;
  }, [get, sellerName]);

  const clearAll = () => {
    const reset: Record<string, string> = {};
    for (const k of FILTER_KEYS) reset[k] = "";
    setParams(reset);
  };

  const category = CATEGORIES.find((c) => c.key === get("category"));
  const heading = sellerName
    ? `Cars from ${sellerName}`
    : get("make")
    ? `${get("make")} cars for sale`
    : category
      ? `${category.label} cars for sale`
      : get("verified") === "1"
        ? "Paper Verified cars"
        : "Cars for sale in Bangladesh";
  const countLabel = `${total.toLocaleString("en-IN")} ${total === 1 ? "car" : "cars"}`;

  return (
    <>
      <PageHero
        eyebrow="Buy a car"
        title={heading}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cars" }]}
        description={<p aria-live="polite">{loading ? "Finding cars…" : `${countLabel} from verified dealers and owners, updated every day.`}</p>}
      >
        <div className="mt-8 grid gap-3 rounded-3xl border border-white/70 bg-white/80 p-3 shadow-float backdrop-blur-xl sm:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="relative">
            <label htmlFor="cars-q" className="sr-only">Search cars</label>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-text" aria-hidden />
            <DebouncedInput id="cars-q" type="search" value={get("q")} onCommit={(v) => setParams({ q: v.trim() })}
              placeholder="Search Axio, Premio, Harrier, Dhaka…" className="search-input pl-11" />
          </div>
          <div>
            <label className="sr-only" htmlFor="sort">Sort by</label>
            <select id="sort" value={get("sort") || "newest"} onChange={(e) => setParams({ sort: e.target.value === "newest" ? "" : e.target.value })} className="search-input">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </PageHero>

      <div className={cn(CONTAINER, "pb-20 pt-6")}>
        {/* Category rail */}
        <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Car type">
          <li>
            <CategoryChip active={!get("category")} onClick={() => setParams({ category: "" })}>All cars</CategoryChip>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.key}>
              <CategoryChip active={get("category") === c.key} onClick={() => setParams({ category: get("category") === c.key ? "" : c.key })}>{c.label}</CategoryChip>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setSheetOpen(true)} className="lg:hidden">
            <SlidersHorizontal size={16} aria-hidden /> Filters
            {activeChips.length > 0 && <span className="rounded-full bg-electric px-1.5 text-xs font-bold text-white tabular">{activeChips.length}</span>}
          </Button>
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => setParams(chip.clear)} aria-label={`Remove filter ${chip.label}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-electric/20 bg-haze pl-3.5 pr-2.5 text-sm font-semibold text-electric-deep transition-colors hover:border-electric">
              {chip.label} <X size={14} aria-hidden />
            </button>
          ))}
          {activeChips.length > 0 && (
            <button type="button" onClick={clearAll} className="h-9 px-2 text-sm font-semibold text-slate-text hover:text-night">Clear all</button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24 max-h-[calc(100dvh-112px)] overflow-y-auto rounded-3xl border border-hairline bg-white p-6 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold">Filters</h2>
                {activeChips.length > 0 && <button type="button" onClick={clearAll} className="text-sm font-semibold text-electric hover:underline">Reset</button>}
              </div>
              <Filters get={get} setParams={setParams} />
            </div>
          </aside>

          <section aria-label="Results">
            {error && listings.length === 0 ? (
              <EmptyState icon={SearchX} title="Couldn't load cars" body={error}
                action={<Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>} />
            ) : loading && listings.length === 0 ? (
              <ResultsGrid>{Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}</ResultsGrid>
            ) : listings.length === 0 ? (
              <EmptyState icon={SearchX} title="No cars match these filters"
                body="Remove a filter or widen your budget. New cars are listed every day."
                action={<Button onClick={clearAll}>Clear all filters</Button>} />
            ) : (
              <>
                <ResultsGrid className={cn("transition-opacity duration-150", loading && "opacity-60")}>
                  {listings.map((car, i) => (
                    <CarCard key={car._id} car={car} priority={i < 3} sizes="(min-width: 1280px) 19rem, (min-width: 640px) 45vw, 92vw" />
                  ))}
                </ResultsGrid>
                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="text-sm text-slate-text tabular">Showing {listings.length.toLocaleString("en-IN")} of {countLabel}</p>
                  {page < pages && (
                    <Button variant="secondary" size="lg" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore && <Loader2 size={16} className="animate-spin" aria-hidden />}
                      {loadingMore ? "Loading…" : "Load more cars"}
                    </Button>
                  )}
                  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent side="bottom">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
            <DialogDescription>Narrow down by budget, make, fuel and more.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5">
            <Filters get={get} setParams={setParams} />
          </div>
          <div className="flex gap-3 border-t border-hairline p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button variant="secondary" onClick={clearAll}>Clear</Button>
            <Button className="grow" onClick={() => setSheetOpen(false)}>
              {loading ? "Show cars" : `Show ${countLabel}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={cn("h-10 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors",
        active ? "border-night bg-night text-white" : "border-hairline bg-white text-slate-text hover:border-electric/40 hover:text-night")}>
      {children}
    </button>
  );
}

function ResultsGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

function ResultsSkeleton() {
  return (
    <div className={cn(CONTAINER, "py-16")}>
      <div className="skeleton h-10 w-72 rounded-xl" />
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
  const commit = useRef(onCommit);
  useEffect(() => {
    commit.current = onCommit;
  });

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
      commit.current(draft);
    }, 400);
    return () => clearTimeout(t);
  }, [draft]);

  return <input {...props} value={draft} onChange={(e) => setDraft(e.target.value)} />;
}

function Filters({ get, setParams }: { get: (k: string) => string; setParams: (u: Record<string, string>) => void }) {
  const toLakh = (v: string) => (v ? String(Number(v) / 100000) : "");
  const fromLakh = (v: string) => (v ? String(Math.round(Number(v) * 100000)) : "");
  const verified = get("verified") === "1";

  return (
    <div className="space-y-7">
      <button type="button" role="switch" aria-checked={verified} onClick={() => setParams({ verified: verified ? "" : "1" })}
        className={cn("flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
          verified ? "border-verified/40 bg-verified-soft" : "border-hairline hover:bg-mist")}>
        <ShieldCheck size={20} className="shrink-0 text-verified" aria-hidden />
        <span className="grow text-sm font-semibold">Paper Verified only</span>
        <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", verified ? "bg-verified" : "bg-[#cbd5e1]")}>
          <span className={cn("absolute left-1 top-1 size-4 rounded-full bg-white shadow transition-transform", verified && "translate-x-4")} />
        </span>
      </button>

      <fieldset>
        <legend className="field-label">Budget</legend>
        <div className="flex flex-wrap gap-1.5">
          {BUDGETS.map((b) => {
            const [min, max] = b.value.split("-");
            const on = get("minPrice") === (min === "0" ? "" : min) && get("maxPrice") === max;
            return (
              <button key={b.value} type="button" aria-pressed={on}
                onClick={() => setParams(on ? { minPrice: "", maxPrice: "" } : { minPrice: min === "0" ? "" : min, maxPrice: max })}
                className={cn("h-9 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                  on ? "border-electric bg-electric text-white" : "border-hairline text-slate-text hover:border-electric/40 hover:text-night")}>
                {b.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor="f-min">Minimum price in lakh</label>
          <DebouncedInput id="f-min" type="number" inputMode="decimal" min={0} value={toLakh(get("minPrice"))} onCommit={(v) => setParams({ minPrice: fromLakh(v) })} placeholder="Min" className="field h-11" />
          <span className="text-slate-text" aria-hidden>–</span>
          <label className="sr-only" htmlFor="f-max">Maximum price in lakh</label>
          <DebouncedInput id="f-max" type="number" inputMode="decimal" min={0} value={toLakh(get("maxPrice"))} onCommit={(v) => setParams({ maxPrice: fromLakh(v) })} placeholder="Max" className="field h-11" />
          <span className="shrink-0 text-sm text-slate-text">lakh</span>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="f-make" className="field-label">Make</label>
          <select id="f-make" value={get("make")} onChange={(e) => setParams({ make: e.target.value, model: "" })} className="field">
            <option value="">All makes</option>
            {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-model" className="field-label">Model</label>
          <DebouncedInput id="f-model" type="text" value={get("model")} onCommit={(v) => setParams({ model: v.trim() })} placeholder="Any" className="field" />
        </div>
        <div>
          <label htmlFor="f-year" className="field-label">Year</label>
          <select id="f-year" value={get("year")} onChange={(e) => setParams({ year: e.target.value })} className="field">
            <option value="">Any</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <Segmented legend="Condition" options={[{ value: "", label: "Any" }, ...CONDITIONS.map((c) => ({ ...c, label: c.value === "reconditioned" ? "Recon" : c.label }))]}
        value={get("condition")} onChange={(v) => setParams({ condition: v })} />

      <fieldset>
        <legend className="field-label">Fuel</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {FUELS.map((f) => {
            const on = get("fuelType") === f.value;
            return (
              <button key={f.value} type="button" aria-pressed={on} onClick={() => setParams({ fuelType: on ? "" : f.value })}
                className={cn("h-10 rounded-xl border text-[13px] font-semibold transition-colors",
                  on ? "border-electric bg-electric text-white" : "border-hairline text-slate-text hover:border-electric/40 hover:text-night")}>
                {f.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Segmented legend="Transmission" options={[{ value: "", label: "Any" }, ...TRANSMISSIONS.filter((t) => t.value !== "semi-automatic")]}
        value={get("transmission")} onChange={(v) => setParams({ transmission: v })} />

      <div>
        <label htmlFor="f-loc" className="field-label">City or area</label>
        <DebouncedInput id="f-loc" type="text" value={get("location")} onCommit={(v) => setParams({ location: v.trim() })} placeholder="Dhaka, Gulshan, Chattogram…" className="field" />
      </div>
    </div>
  );
}

function Segmented({ legend, options, value, onChange }: {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="field-label">{legend}</legend>
      <div className="flex rounded-2xl bg-mist p-1">
        {options.map((o) => (
          <button key={o.value || "any"} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
            className={cn("h-9 grow rounded-xl px-2 text-[13px] font-semibold transition-colors",
              value === o.value ? "bg-white text-night shadow-soft" : "text-slate-text hover:text-night")}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
