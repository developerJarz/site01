"use client";

import { Check, GitCompareArrows, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import type { CarCardData } from "@/components/CarCard";
import { useMarketplace } from "@/context/MarketplaceContext";
import { cn } from "@/lib/utils";
import { ShareButton } from "./ShareButton";

/** Save, compare and share for the car detail page; the same state the cards use. */
export function CarActions({ car }: { car: CarCardData }) {
  const { status } = useSession();
  const { favoriteIds, pendingIds, toggleFavorite, compareCars, toggleCompare, openPanel } = useMarketplace();
  const saved = favoriteIds.includes(car._id);
  const comparing = compareCars.some((c) => c._id === car._id);

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void toggleFavorite(car._id)} disabled={status === "loading" || pendingIds.includes(car._id)} aria-pressed={saved}
        className={cn("inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:opacity-60",
          saved ? "border-[#ff3b5c]/30 bg-[#fff0f3] text-[#d61f45]" : "border-hairline bg-white text-night hover:bg-mist")}>
        <Heart size={17} fill={saved ? "currentColor" : "none"} aria-hidden /> {saved ? "Saved" : "Save"}
      </button>
      <button type="button" aria-pressed={comparing}
        onClick={() => {
          toggleCompare(car);
          if (!comparing && compareCars.length >= 1) openPanel("compare");
        }}
        className={cn("inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
          comparing ? "border-electric bg-haze text-electric" : "border-hairline bg-white text-night hover:bg-mist")}>
        {comparing ? <Check size={17} aria-hidden /> : <GitCompareArrows size={17} aria-hidden />} {comparing ? "Comparing" : "Compare"}
      </button>
      <ShareButton title={car.title} />
    </div>
  );
}
