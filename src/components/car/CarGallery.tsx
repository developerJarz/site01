"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FALLBACK_CAR_IMAGE, cn } from "@/lib/utils";

const optimisable = (src: string) => src.startsWith("/") || src.startsWith("https://images.unsplash.com/");

/**
 * Native scroll-snap carousel: swipe on touch, arrow keys and buttons on desktop.
 * Only the first photo loads eagerly; the rest load as they come into view.
 */
export function CarGallery({ images, title, children }: { images: string[]; title: string; children?: React.ReactNode }) {
  const photos = images.length > 0 ? images : [FALLBACK_CAR_IMAGE];
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, photos.length - 1));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }, [photos.length]);

  // Keep the counter and thumbnails in sync with swipes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const thumb = thumbsRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [index]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="group relative bg-ink-deep"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") goTo(index + 1);
          if (e.key === "ArrowLeft") goTo(index - 1);
        }}
      >
        <div
          ref={trackRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
          className="scrollbar-none flex aspect-[16/10] snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative h-full w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="slide"
              aria-label={`Photo ${i + 1} of ${photos.length}`}
            >
              <Image
                src={src}
                alt={i === 0 ? title : `${title}, photo ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 50rem, 100vw"
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                unoptimized={!optimisable(src)}
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {children}

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lift transition-opacity hover:bg-white disabled:opacity-0 md:flex"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === photos.length - 1}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lift transition-opacity hover:bg-white disabled:opacity-0 md:flex"
            >
              <ChevronRight size={22} />
            </button>
            <p className="absolute bottom-3 right-3 rounded-md bg-ink-deep/80 px-2.5 py-1 text-sm font-semibold text-white tabular" aria-live="polite">
              {index + 1} / {photos.length}
            </p>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div ref={thumbsRef} className="scrollbar-none flex gap-2 overflow-x-auto p-2.5">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={index === i}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                index === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill sizes="96px" loading="lazy" unoptimized={!optimisable(src)} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
