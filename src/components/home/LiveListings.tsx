"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Pause, Play, ShieldCheck } from "lucide-react";
import { CarImage } from "@/components/CarImage";
import type { RecentListing } from "@/lib/recent-listings";
import { cn, formatLakh, timeAgo } from "@/lib/utils";

const POLL_MS = 45_000;
const DAY_MS = 86_400_000;

/** Newest cars as a slowly rolling feed. New arrivals since the page loaded are flagged as they come in. */
export function LiveListings({ initial }: { initial: RecentListing[] }) {
  const [cars, setCars] = useState(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false);
  const lastFetch = useRef(0);
  // Set after mount: "today" depends on the viewer clock, which the server render cannot know.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    lastFetch.current = Date.now();
    setNow(Date.now());
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      lastFetch.current = Date.now();
      setNow(Date.now());
      try {
        const res = await fetch("/api/listings/recent");
        if (!res.ok) return;
        const { listings } = (await res.json()) as { listings: RecentListing[] };
        if (!alive || !listings?.length) return;
        setCars((current) => {
          const known = new Set(current.map((c) => c._id));
          const added = listings.filter((c) => !known.has(c._id)).map((c) => c._id);
          if (added.length) setFresh((f) => new Set([...f, ...added]));
          return listings;
        });
      } catch { /* The feed keeps showing what it has. */ }
    };
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible" && Date.now() - lastFetch.current > POLL_MS) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const today = now === null ? 0 : cars.filter((c) => now - new Date(c.createdAt).getTime() < DAY_MS).length;
  const rolling = cars.length >= 5;

  return (
    <div className="border-beam relative rounded-[28px] border border-white/70 bg-white/85 shadow-float backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-hairline/80 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#22c55e] opacity-70" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[#16a34a]" />
          </span>
          <h2 className="text-sm font-extrabold tracking-tight">
            <span className="text-shimmer">Live</span> <span className="text-night">· Just listed</span>
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-haze px-2.5 py-1 text-[11px] font-bold text-electric-deep tabular">
            {today > 0 ? `${today} new today` : `${cars.length} latest`}
          </span>
          {rolling && (
            <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused}
              aria-label={paused ? "Resume the live feed" : "Pause the live feed"}
              className="flex size-8 items-center justify-center rounded-full text-slate-text transition-colors hover:bg-mist hover:text-night">
              {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
            </button>
          )}
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="font-bold">No cars listed yet</p>
          <p className="mt-1 text-sm text-slate-text">New listings will roll in here as sellers post them.</p>
        </div>
      ) : (
        <div className={cn("ticker-wrap relative h-[288px] overflow-hidden sm:h-[336px] lg:h-[372px]", paused && "ticker-paused")}
          style={{ maskImage: "linear-gradient(transparent, #000 8%, #000 92%, transparent)" }}>
          <div className={rolling ? "ticker-y" : undefined} style={{ "--ticker-duration": `${cars.length * 3.6}s` } as React.CSSProperties}>
            <FeedList cars={cars} fresh={fresh} />
            {rolling && <FeedList cars={cars} fresh={fresh} duplicate />}
          </div>
        </div>
      )}

      <Link href="/cars" className="group flex items-center justify-between rounded-b-[28px] border-t border-hairline/80 px-5 py-3.5 text-sm font-bold text-electric hover:bg-mist/70">
        See all new arrivals <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}

function FeedList({ cars, fresh, duplicate }: { cars: RecentListing[]; fresh: Set<string>; duplicate?: boolean }) {
  return (
    // The second copy only exists to make the loop seamless; it is hidden from assistive tech and the tab order.
    <ul className={cn("space-y-1.5 px-3 py-1.5", duplicate && "ticker-dup")} aria-hidden={duplicate || undefined} {...(duplicate ? { inert: true } : {})}>
      {cars.map((car) => {
        const name = car.make && car.model ? `${car.year ? `${car.year} ` : ""}${car.make} ${car.model}` : car.title;
        const isNew = fresh.has(car._id);
        return (
          <li key={car._id} data-listing-id={duplicate ? undefined : car._id}>
            <Link href={`/cars/${car.slug}`} tabIndex={duplicate ? -1 : undefined}
              className={cn("group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-mist", isNew && "bg-verified-soft/70")}>
              <span className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-mist">
                <CarImage src={car.images?.[0]} alt="" sizes="72px" className="transition-transform duration-500 group-hover:scale-110" />
              </span>
              <span className="min-w-0 grow">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-night group-hover:text-electric">{name}</span>
                  {car.paperVerified && <ShieldCheck size={14} className="shrink-0 text-verified" aria-label="Paper Verified" />}
                </span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-text">
                  <MapPin size={11} className="shrink-0" aria-hidden />
                  <span className="truncate">{car.location || "Bangladesh"}</span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0" suppressHydrationWarning>{isNew ? "just now" : timeAgo(car.createdAt)}</span>
                </span>
              </span>
              <span className="price-tag shrink-0 text-sm text-electric">{formatLakh(car.price)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
