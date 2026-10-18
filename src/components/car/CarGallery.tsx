"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Shrink, X, ZoomIn } from "lucide-react";
import { FALLBACK_CAR_IMAGE, cn } from "@/lib/utils";

const optimisable = (src: string) =>
  src.startsWith("/") ||
  src.startsWith("https://images.unsplash.com/") ||
  src.startsWith("https://res.cloudinary.com/");

/**
 * Universal Car Gallery:
 * - Edge-to-edge universal frame (aspect-[16/10]) ensuring all car photos fit uniformly.
 * - Zero black margins/borders: uses object-cover by default with soft ambient backdrop.
 * - Optional "Show full photo" toggle and full-screen lightbox for high-resolution inspection.
 * - Automatic graceful fallback if any image source fails to load.
 */
export function CarGallery({
  images,
  alts = [],
  title,
  children,
}: {
  images: string[];
  /** Alt text per photo (admin-written or generated from the car details). */
  alts?: string[];
  title: string;
  children?: React.ReactNode;
}) {
  const altFor = (i: number) => alts[i] || (i === 0 ? title : `${title}, photo ${i + 1}`);
  const initialPhotos = images.length > 0 ? images : [FALLBACK_CAR_IMAGE];
  const [photoList, setPhotoList] = useState<string[]>(initialPhotos);
  const [index, setIndex] = useState(0);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Sync photo list if prop changes
  useEffect(() => {
    setPhotoList(images.length > 0 ? images : [FALLBACK_CAR_IMAGE]);
    setIndex(0);
  }, [images]);

  const handleImageError = useCallback((failedIndex: number) => {
    setPhotoList((prev) => {
      const next = [...prev];
      if (next[failedIndex] !== FALLBACK_CAR_IMAGE) {
        next[failedIndex] = FALLBACK_CAR_IMAGE;
      }
      return next;
    });
  }, []);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, photoList.length - 1));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }, [photoList.length]);

  // Keep counter and active slide in sync with user scrolling/swiping
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const newIndex = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        setIndex(Math.max(0, Math.min(newIndex, photoList.length - 1)));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [photoList.length]);

  // Scroll active thumbnail into view
  useEffect(() => {
    const thumb = thumbsRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [index]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") setIndex((prev) => Math.min(prev + 1, photoList.length - 1));
      if (e.key === "ArrowLeft") setIndex((prev) => Math.max(prev - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLightboxOpen, photoList.length]);

  const currentPhoto = photoList[index] || FALLBACK_CAR_IMAGE;

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
        {/* Universal Car Photo Frame */}
        <div
          className="group relative overflow-hidden bg-slate-100/80"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goTo(index + 1);
            if (e.key === "ArrowLeft") goTo(index - 1);
          }}
        >
          {/* Ambient blurred backdrop: fills frame subtly so no harsh borders ever appear */}
          <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
            <Image
              src={currentPhoto}
              alt=""
              fill
              unoptimized={!optimisable(currentPhoto)}
              className="object-cover blur-2xl scale-110 opacity-30 brightness-95 transition-all duration-500"
            />
          </div>

          {/* Main Carousel Track: Universal 16:10 Aspect Ratio */}
          <div
            ref={trackRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={`${title} photos`}
            className="scrollbar-none relative z-10 flex aspect-[16/10] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            {photoList.map((src, i) => (
              <div
                key={i}
                className="relative h-full w-full shrink-0 snap-center overflow-hidden"
                role="group"
                aria-roledescription="slide"
                aria-label={`Photo ${i + 1} of ${photoList.length}`}
              >
                <Image
                  src={src}
                  alt={altFor(i)}
                  fill
                  sizes="(min-width: 1024px) 52rem, 100vw"
                  priority={i === 0}
                  loading={i === 0 ? undefined : "lazy"}
                  unoptimized={!optimisable(src)}
                  onError={() => handleImageError(i)}
                  className={cn(
                    "transition-all duration-300",
                    fitMode === "cover" ? "object-cover" : "object-contain"
                  )}
                />
              </div>
            ))}
          </div>

          {children}

          {/* Top-Right Controls: Frame Fit Mode & Lightbox Zoom */}
          <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFitMode((m) => (m === "cover" ? "contain" : "cover"))}
              title={fitMode === "cover" ? "Fit whole image without cropping" : "Fill frame"}
              aria-label={fitMode === "cover" ? "Fit whole image without cropping" : "Fill frame"}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-semibold text-night shadow-sm backdrop-blur transition-all hover:bg-white hover:scale-105 active:scale-95"
            >
              {fitMode === "cover" ? (
                <>
                  <Shrink size={14} className="text-electric" aria-hidden />
                  <span className="hidden sm:inline">Fit photo</span>
                </>
              ) : (
                <>
                  <Expand size={14} className="text-electric" aria-hidden />
                  <span className="hidden sm:inline">Fill frame</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              title="View full-size photo"
              aria-label="View full-size photo"
              className="flex size-9 items-center justify-center rounded-full bg-white/90 text-night shadow-sm backdrop-blur transition-all hover:bg-white hover:scale-105 active:scale-95"
            >
              <ZoomIn size={16} aria-hidden />
            </button>
          </div>

          {/* Previous / Next Arrow Controls */}
          {photoList.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Previous photo"
                className="absolute left-3.5 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-night shadow-float backdrop-blur transition-all hover:bg-white hover:scale-110 disabled:pointer-events-none disabled:opacity-0 md:flex"
              >
                <ChevronLeft size={22} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === photoList.length - 1}
                aria-label="Next photo"
                className="absolute right-3.5 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-night shadow-float backdrop-blur transition-all hover:bg-white hover:scale-110 disabled:pointer-events-none disabled:opacity-0 md:flex"
              >
                <ChevronRight size={22} aria-hidden />
              </button>

              {/* Photo Counter Pill */}
              <div
                className="absolute bottom-3.5 right-3.5 z-20 rounded-full bg-night/80 px-3.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur tabular"
                aria-live="polite"
              >
                {index + 1} / {photoList.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Navigation Strip */}
        {photoList.length > 1 && (
          <div ref={thumbsRef} className="scrollbar-none flex gap-2.5 overflow-x-auto p-3.5 bg-white border-t border-hairline">
            {photoList.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  goTo(i);
                  setIndex(i);
                }}
                aria-label={`Show photo ${i + 1}`}
                aria-current={index === i}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 bg-slate-100",
                  index === i
                    ? "border-electric ring-2 ring-electric/25 scale-[1.02] shadow-sm"
                    : "border-transparent opacity-65 hover:opacity-100 hover:border-slate-300"
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="96px"
                  loading="lazy"
                  unoptimized={!optimisable(src)}
                  onError={() => handleImageError(i)}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} full photo view`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close full view"
            className="absolute right-5 top-5 z-50 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={24} aria-hidden />
          </button>

          <div
            className="relative flex h-full max-h-[90vh] w-full max-w-6xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentPhoto}
              alt={altFor(index)}
              fill
              unoptimized={!optimisable(currentPhoto)}
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {photoList.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((prev) => Math.max(prev - 1, 0));
                }}
                disabled={index === 0}
                aria-label="Previous full photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-20"
              >
                <ChevronLeft size={28} aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((prev) => Math.min(prev + 1, photoList.length - 1));
                }}
                disabled={index === photoList.length - 1}
                aria-label="Next full photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-20"
              >
                <ChevronRight size={28} aria-hidden />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur tabular">
                {index + 1} / {photoList.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
