"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Filter, SlidersHorizontal, MapPin, Search, Loader2 } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import axios from "axios";

export default function CarsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>}>
      <CarsContent />
    </Suspense>
  );
}

function CarsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states initialized from URL
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [make, setMake] = useState(searchParams.get("make") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [fuelType, setFuelType] = useState(searchParams.get("fuelType") || "");
  const [transmission, setTransmission] = useState(searchParams.get("transmission") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  // Fetch data
  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (make) params.set("make", make);
      if (condition) params.set("condition", condition);
      if (fuelType) params.set("fuelType", fuelType);
      if (transmission) params.set("transmission", transmission);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);

      const res = await axios.get(`/api/listings/search?${params.toString()}`);
      setListings(res.data.listings || []);

      // Update URL without full reload
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    } catch (err) {
      console.error("Failed to fetch listings", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters change (debounced for text/number inputs)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchListings();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [q, minPrice, maxPrice]);

  // Fetch immediately on select changes
  useEffect(() => {
    // Only fetch if it's not the initial mount to prevent double fetch, 
    // but we can just let it fetch as the debounced effect will also run.
    fetchListings();
  }, [make, condition, fuelType, transmission]);

  const handleClearFilters = () => {
    setQ("");
    setMake("");
    setCondition("");
    setFuelType("");
    setTransmission("");
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Cars for Sale</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Filter size={20} /> Filters
              </div>
              <button 
                onClick={handleClearFilters}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Brand, model, or title..."
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Make/Brand */}
              <div>
                <label className="block text-sm font-medium mb-2">Make / Brand</label>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Brands</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="BMW">BMW</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Conditions</option>
                  <option value="new">Brand New</option>
                  <option value="used">Used</option>
                  <option value="reconditioned">Reconditioned</option>
                </select>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Fuel Types</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                  <option value="cng">CNG</option>
                  <option value="octane">Octane</option>
                </select>
              </div>

              {/* Transmission */}
              <div>
                <label className="block text-sm font-medium mb-2">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Types</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="semi-automatic">Semi-Automatic</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Price Range (৳)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Cars for Sale
              {loading && <Loader2 size={20} className="animate-spin text-primary" />}
            </h1>
            <p className="text-muted-foreground">{listings.length} Results</p>
          </div>

          {!loading && listings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <h3 className="text-xl font-bold mb-2">No cars found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to find what you&apos;re looking for.
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-block mt-4 text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {listings.map((car: any) => (
                <div
                  key={car._id}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all group flex flex-col"
                >
                  <Link href={`/cars/${car.slug}`}>
                    <div className="relative h-48 overflow-hidden bg-muted">
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{
                          backgroundImage: `url(${car.images?.[0] || "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=600"})`,
                        }}
                      />
                      {car.featured && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                          FEATURED
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded capitalize">
                        {car.condition}
                      </div>
                    </div>
                  </Link>
                  <div className="p-5 flex-grow flex flex-col">
                    <Link href={`/cars/${car.slug}`}>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-1">
                        {car.title}
                      </h3>
                    </Link>
                    <p className="text-xl font-bold text-primary mb-4">
                      ৳ {car.price?.toLocaleString()}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        {car.mileage?.toLocaleString()} km
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        {car.transmission}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        {car.fuelType}
                      </span>
                      <span className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                        <MapPin size={12} /> {car.location}
                      </span>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border">
                      <Link
                        href={`/cars/${car.slug}`}
                        className="block text-center w-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground py-2 rounded-lg font-medium transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
