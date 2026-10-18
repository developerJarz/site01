"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Loader2, MapPin, Search, X } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import { cn, formatLakh } from "@/lib/utils";

interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  year: number;
  location: string;
}

const POPULAR = ["Toyota Axio", "Honda Vezel", "Premio", "Noah", "Hybrid", "Chattogram"];

/** Live search: debounced lookups against /api/search, with arrow-key navigation. `compact` fits the one-line header. */
export function NavSearch({ autoFocus, onNavigate, className, compact }: { autoFocus?: boolean; onNavigate?: () => void; className?: string; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const router = useProgressRouter();
  const listId = useId();
  const inputId = useId();

  // An in-flight request is cancelled whenever the query changes.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      requestRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
        setActive(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };
  const searchAll = (q = query) => go(q.trim() ? `/cars?q=${encodeURIComponent(q.trim())}` : "/cars");

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const showResults = open && query.trim().length >= 2 && !loading;
  // In the mobile sheet the popular searches show until the shopper starts typing.
  const showPopular = autoFocus && query.trim().length < 2;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && results[active]) go(`/cars/${results[active].slug}`);
          else searchAll();
        }}
        className={cn(
          "group flex items-center border border-hairline bg-mist/80 transition-[border-color,background-color,box-shadow] focus-within:border-electric focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(14_106_168/0.15)]",
          compact ? "h-10 gap-2 rounded-xl pl-3 pr-1" : "h-12 gap-2.5 rounded-2xl pl-4 pr-1.5"
        )}
      >
        <label htmlFor={inputId} className="sr-only">Search cars, brands, models</label>
        <Search size={18} className="shrink-0 text-slate-text group-focus-within:text-electric" aria-hidden />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={compact ? "Search cars..." : "Search cars, brands, models..."}
          className={cn("h-full w-full min-w-0 bg-transparent text-night outline-none placeholder:text-slate-text/80 [&::-webkit-search-cancel-button]:hidden", compact ? "text-sm" : "text-base")}
          autoComplete="off"
          enterKeyHint="search"
        />
        {loading && <Loader2 size={17} className="shrink-0 animate-spin text-slate-text" aria-label="Searching" />}
        {query && !loading && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-text hover:bg-haze hover:text-night"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        {/* Enter submits the compact field; its button stays for screen readers. */}
        <button type="submit" className={cn("flex h-9 shrink-0 items-center rounded-xl bg-electric px-4 text-[13px] font-semibold text-white transition-colors hover:bg-electric-deep", compact && "sr-only")}>
          Search
        </button>
      </form>

      {showPopular && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-text">Popular searches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR.map((s) => (
              <button key={s} type="button" onClick={() => searchAll(s)} className="rounded-full border border-hairline bg-white px-3.5 py-2 text-sm font-medium text-night hover:border-electric/40 hover:text-electric">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && (
        <div className={cn(
          "animate-in z-50 overflow-hidden rounded-2xl border border-hairline bg-white text-night shadow-float",
          autoFocus ? "mt-3" : compact ? "absolute right-0 top-[calc(100%+10px)] w-[min(26rem,calc(100vw-2rem))]" : "absolute inset-x-0 top-[calc(100%+8px)]"
        )}>
          {results.length === 0 ? (
            <div className="px-5 py-5">
              <p className="font-semibold">No cars match “{query}” yet</p>
              <p className="mt-1 text-sm text-slate-text">Check the spelling, or browse every car and filter by price or body type.</p>
              <button onClick={() => searchAll("")} className="mt-3 text-sm font-semibold text-electric hover:underline">Browse all cars</button>
            </div>
          ) : (
            <>
              <ul id={listId} role="listbox" aria-label="Matching cars" className="max-h-[22rem] overflow-y-auto p-1.5">
                {results.map((car, i) => (
                  <li
                    key={car._id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => { e.preventDefault(); go(`/cars/${car.slug}`); }}
                    className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2", active === i ? "bg-haze" : "hover:bg-mist")}
                  >
                    <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-mist">
                      <CarImage src={car.images?.[0]} alt="" sizes="64px" />
                    </div>
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-semibold">{car.title}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-text">
                        <MapPin size={12} aria-hidden /> {car.location}
                        {car.year ? <span className="ml-1">· {car.year}</span> : null}
                      </p>
                    </div>
                    <p className="price-tag shrink-0 text-sm text-electric">{formatLakh(car.price)}</p>
                  </li>
                ))}
              </ul>
              <button
                onMouseDown={(e) => { e.preventDefault(); searchAll(); }}
                className="flex w-full items-center justify-between border-t border-hairline px-4 py-3 text-left text-sm font-semibold text-electric hover:bg-mist"
              >
                See all results for “{query.trim()}” <ArrowUpRight size={16} aria-hidden />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
