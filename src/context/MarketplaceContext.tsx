"use client";

import { useProgressRouter } from "@/components/layout/RouteProgress";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { CarCardData } from "@/components/CarCard";

export type MarketplacePanel = "saved" | "compare" | "notifications";

interface MarketplaceState {
  panel: MarketplacePanel | null;
  openPanel: (panel: MarketplacePanel) => void;
  closePanel: () => void;
  favoriteIds: string[];
  pendingIds: string[];
  savedCars: CarCardData[];
  favoritesLoading: boolean;
  error: string;
  refreshFavorites: (signal?: AbortSignal) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  compareCars: CarCardData[];
  toggleCompare: (car: CarCardData) => void;
  clearCompare: () => void;
}

export const COMPARE_LIMIT = 3;

const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const owner = useRef(userId);
  const pathname = usePathname();
  const router = useProgressRouter();
  const [panel, setPanel] = useState<MarketplacePanel | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [savedCars, setSavedCars] = useState<CarCardData[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(new Set<string>());
  const [compareCars, setCompareCars] = useState<CarCardData[]>([]);

  const toggleCompare = useCallback((car: CarCardData) => {
    setCompareCars((cars) => cars.some((c) => c._id === car._id)
      ? cars.filter((c) => c._id !== car._id)
      // The oldest pick drops off so the newest choice always lands.
      : [...cars, car].slice(-COMPARE_LIMIT));
  }, []);
  const clearCompare = useCallback(() => setCompareCars([]), []);

  const refreshFavorites = useCallback(async (signal?: AbortSignal) => {
    if (!userId) return;
    setFavoritesLoading(true);
    setError("");
    try {
      const response = await fetch("/api/favorites", { signal, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load saved cars.");
      if (owner.current === userId && !signal?.aborted) {
        setFavoriteIds(data.ids || []);
        setSavedCars(data.listings || []);
      }
    } catch (e) {
      if (!signal?.aborted && owner.current === userId) setError(e instanceof Error ? e.message : "Could not load saved cars.");
    } finally {
      if (!signal?.aborted && owner.current === userId) setFavoritesLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    owner.current = userId;
    setFavoriteIds([]);
    setSavedCars([]);
    setPendingIds([]);
    setFavoritesLoading(false);
    setError("");
    inFlight.current.clear();
  }, [userId]);

  // Once per signed-in user, so hearts show the right state on every page.
  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    void refreshFavorites(controller.signal);
    return () => controller.abort();
  }, [status, refreshFavorites]);

  // A heart tapped on another page adds an id but not the car itself; reload when the wishlist opens.
  useEffect(() => {
    if (panel !== "saved" || status !== "authenticated") return;
    if (favoriteIds.every((id) => savedCars.some((car) => car._id === id))) return;
    const controller = new AbortController();
    void refreshFavorites(controller.signal);
    return () => controller.abort();
  }, [panel, status]);

  useEffect(() => { setPanel(null); }, [pathname]);

  const toggleFavorite = useCallback(async (id: string) => {
    if (status === "loading" || inFlight.current.has(id)) return;
    if (!userId) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    const wasSaved = favoriteIds.includes(id);
    inFlight.current.add(id);
    setPendingIds((ids) => [...ids, id]);
    setError("");
    setFavoriteIds((ids) => wasSaved ? ids.filter((value) => value !== id) : [...ids, id]);
    try {
      const response = await fetch("/api/favorites", {
        method: wasSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update saved cars.");
      if (owner.current === userId && wasSaved) setSavedCars((cars) => cars.filter((car) => car._id !== id));
    } catch (e) {
      if (owner.current === userId) {
        setFavoriteIds((ids) => wasSaved ? [...ids.filter((value) => value !== id), id] : ids.filter((value) => value !== id));
        setError(e instanceof Error ? e.message : "Could not update saved cars.");
      }
    } finally {
      if (owner.current === userId) {
        inFlight.current.delete(id);
        setPendingIds((ids) => ids.filter((value) => value !== id));
      }
    }
  }, [favoriteIds, pathname, router, status, userId]);

  return <MarketplaceContext.Provider value={{ panel, openPanel: setPanel, closePanel: () => setPanel(null),
    favoriteIds, pendingIds, savedCars, favoritesLoading, error, refreshFavorites, toggleFavorite,
    compareCars, toggleCompare, clearCompare }}>
    {children}
  </MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error("Marketplace controls require their provider.");
  return context;
}
