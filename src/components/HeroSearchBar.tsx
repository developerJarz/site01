"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Loader2 } from "lucide-react";

interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  make: string;
  model: string;
  year: number;
  location: string;
}

export function HeroSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 300);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/cars/${results[selectedIndex].slug}`);
        setIsOpen(false);
        setQuery("");
      } else {
        // Submit as full-page search
        router.push(`/cars?make=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative max-w-3xl mx-auto w-full">
      {/* Input Bar */}
      <div className="glass-panel p-2 rounded-full flex items-center">
        <div className="flex-grow flex items-center bg-white/10 rounded-full px-4 py-2 relative">
          <Search className="text-gray-300 mr-2 flex-shrink-0" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Search by brand, model, or location..."
            className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-300"
            autoComplete="off"
          />
          {query && (
            <button onClick={clearSearch} className="text-gray-400 hover:text-white transition-colors ml-2 flex-shrink-0">
              <X size={18} />
            </button>
          )}
          {isLoading && (
            <Loader2 size={18} className="text-gray-300 animate-spin ml-2 flex-shrink-0" />
          )}
        </div>
        <button
          onClick={() => {
            router.push(`/cars?make=${encodeURIComponent(query)}`);
            setIsOpen(false);
          }}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-medium ml-2 transition-colors flex-shrink-0"
        >
          Search
        </button>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length === 0 && !isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              <Search size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cars found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1">Try a different brand or model</p>
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs text-muted-foreground font-medium">
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <ul>
                {results.map((car, i) => (
                  <li key={car._id}>
                    <button
                      onClick={() => {
                        router.push(`/cars/${car.slug}`);
                        setIsOpen(false);
                        setQuery("");
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                        selectedIndex === i
                          ? "bg-primary/10"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={car.images?.[0] || "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=60&w=120"}
                          alt={car.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-sm truncate">{car.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} /> {car.location}
                        </p>
                      </div>
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-primary text-sm">
                          ৳ {car.price?.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    router.push(`/cars?make=${encodeURIComponent(query)}`);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-primary font-medium hover:bg-muted/50 transition-colors text-center"
                >
                  View all results for &ldquo;{query}&rdquo; →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
