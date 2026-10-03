"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, MapPin } from "lucide-react";
import { FALLBACK_CAR_IMAGE, cn, formatLakh } from "@/lib/utils";

interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  year: number;
  location: string;
}

const SUGGESTIONS = ["Toyota Axio", "Honda Vezel", "Premio", "Noah", "Hybrid", "Chattogram"];

export function HeroSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const listId = useId();

  // Debounced lookup; an in-flight request is cancelled when the query changes.
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

  const searchAll = (q = query) => {
    setOpen(false);
    router.push(q.trim() ? `/cars?q=${encodeURIComponent(q.trim())}` : "/cars");
  };

  const goTo = (car: SearchResult) => {
    setOpen(false);
    router.push(`/cars/${car.slug}`);
  };

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

  const showPanel = open && query.trim().length >= 2 && !loading;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && results[active]) goTo(results[active]);
          else searchAll();
        }}
        className="flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-pop"
      >
        <label htmlFor="hero-search" className="sr-only">
          Search cars by make, model or city
        </label>
        <div className="flex flex-grow items-center gap-2.5 pl-3">
          <Search size={20} className="shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            id="hero-search"
            type="search"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search make, model or city"
            className="h-11 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            autoComplete="off"
            enterKeyHint="search"
          />
          {loading && <Loader2 size={18} className="shrink-0 animate-spin text-muted-foreground" aria-label="Searching" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-[#0a4594] sm:px-7"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[#b9d3f0]">Popular:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => searchAll(s)}
            className="rounded-full border border-white/20 px-3 py-1 font-medium text-white/90 transition-colors hover:border-white/50 hover:bg-white/10 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>

      {showPanel && (
        <div className="animate-in absolute inset-x-0 top-[3.75rem] z-40 overflow-hidden rounded-xl border border-border bg-popover text-foreground shadow-pop">
          {results.length === 0 ? (
            <div className="px-5 py-6">
              <p className="font-semibold">No cars match “{query}” yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Check the spelling, or browse every car and filter by price or body type.</p>
              <button onClick={() => searchAll("")} className="mt-3 text-sm font-semibold text-primary hover:underline">
                Browse all cars
              </button>
            </div>
          ) : (
            <>
              <ul id={listId} role="listbox" aria-label="Matching cars" className="max-h-[22rem] overflow-y-auto py-1.5">
                {results.map((car, i) => (
                  <li
                    key={car._id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goTo(car);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-3.5 px-4 py-2.5",
                      active === i ? "bg-accent" : "hover:bg-muted"
                    )}
                  >
                    <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={car.images?.[0] || FALLBACK_CAR_IMAGE}
                        alt=""
                        fill
                        sizes="64px"
                        unoptimized={!(car.images?.[0] || FALLBACK_CAR_IMAGE).match(/^(\/|https:\/\/images\.unsplash\.com\/)/)}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="truncate text-[15px] font-semibold">{car.title}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin size={13} aria-hidden /> {car.location}
                        {car.year ? <span className="ml-1.5">{car.year}</span> : null}
                      </p>
                    </div>
                    <p className="price-tag shrink-0 text-[15px]">{formatLakh(car.price)}</p>
                  </li>
                ))}
              </ul>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  searchAll();
                }}
                className="w-full border-t border-border px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-muted"
              >
                See all results for “{query.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
