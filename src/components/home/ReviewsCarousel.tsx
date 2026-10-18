"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReviewItem = { id: string; name: string; role: string; location?: string; rating: number; content: string };

// Initials on a brand gradient: no stock faces standing in for real customers.
const AVATAR_TINTS = ["from-electric to-electric-light", "from-[#7c3aed] to-[#a78bfa]", "from-[#0d9488] to-[#5eead4]", "from-[#ea580c] to-[#fdba74]"];
const INTERVAL_MS = 5000;

/** Scroll-snap carousel: swipe on phones, arrows and dots everywhere, auto-advances until the visitor interacts. */
export function ReviewsCarousel({ items }: { items: ReviewItem[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);

  const scrollTo = useCallback((i: number) => {
    const el = track.current;
    const card = el?.children[0] as HTMLElement | undefined;
    if (!el || !card) return;
    const count = items.length;
    const next = ((i % count) + count) % count;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    el.scrollTo({ left: next * step, behavior: "smooth" });
  }, [items.length]);

  // Track which card is in view as the visitor swipes.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const card = el.children[0] as HTMLElement | undefined;
        if (!card) return;
        const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
        // At the end of the rail the last cards can't scroll to the start, so treat "scrolled to end" as the last card.
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
        setActive(atEnd ? items.length - 1 : Math.round(el.scrollLeft / step));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [items.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || hovered || items.length < 2) return;
    const id = window.setInterval(() => scrollTo(active + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, hovered, active, items.length, scrollTo]);

  if (!items.length) return null;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <ul
        ref={track}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {items.map((t, i) => (
          <li
            key={t.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`Review ${i + 1} of ${items.length}`}
            className="w-[85%] max-w-sm shrink-0 snap-start sm:w-[calc(50%-10px)] sm:max-w-none lg:w-[calc((100%-40px)/3)]"
          >
            <figure className="relative flex h-full flex-col rounded-3xl border border-hairline bg-gradient-to-b from-white to-mist p-7 shadow-soft">
              <Quote size={36} className="absolute right-6 top-6 text-electric/10" aria-hidden />
              <div className="flex gap-0.5" role="img" aria-label={`Rated ${t.rating} out of 5`}>
                {Array.from({ length: 5 }, (_, s) => (
                  <Star key={s} size={18} className={s < t.rating ? "fill-[#ffb800] text-[#ffb800]" : "text-hairline"} aria-hidden />
                ))}
              </div>
              <blockquote className="mt-5 grow text-[17px] leading-relaxed text-night">&ldquo;{t.content}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_TINTS[i % AVATAR_TINTS.length]} text-base font-bold text-white shadow-soft`} aria-hidden>
                  {t.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{t.name}</span>
                  <span className="block truncate text-sm text-slate-text">{[t.role, t.location].filter(Boolean).join(" · ")}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={() => scrollTo(active - 1)} aria-label="Previous review"
            className="flex size-10 items-center justify-center rounded-full border border-hairline bg-white text-night shadow-soft transition-colors hover:border-electric/40 hover:text-electric">
            <ChevronLeft size={18} aria-hidden />
          </button>
          <div className="flex items-center gap-1.5">
            {items.map((t, i) => (
              <button key={t.id} type="button" onClick={() => scrollTo(i)} aria-label={`Show review ${i + 1}`} aria-current={active === i}
                className={cn("h-2 rounded-full transition-all", active === i ? "w-6 bg-electric" : "w-2 bg-hairline hover:bg-slate-text/40")} />
            ))}
          </div>
          <button type="button" onClick={() => scrollTo(active + 1)} aria-label="Next review"
            className="flex size-10 items-center justify-center rounded-full border border-hairline bg-white text-night shadow-soft transition-colors hover:border-electric/40 hover:text-electric">
            <ChevronRight size={18} aria-hidden />
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause automatic scrolling" : "Play automatic scrolling"}
            className="ml-1 flex size-10 items-center justify-center rounded-full text-slate-text transition-colors hover:bg-white hover:text-night">
            {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
          </button>
        </div>
      )}
    </div>
  );
}
