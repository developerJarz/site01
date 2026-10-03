"use client";

import { useState } from "react";
import Image from "next/image";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarImageProps {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Listing photos arrive in three forms:
 *  - /uploads/<file> or /api/listing-image/... → local, optimised by next/image (AVIF/WebP, resized)
 *  - https://images.unsplash.com/...           → allowed remote host, optimised
 *  - anything else                              → rendered unoptimised so an unexpected URL can't crash the page
 * A missing or broken photo shows a neutral tile, never a stand-in car a buyer might mistake for this one.
 */
export function CarImage({ src, alt, sizes, priority, className }: CarImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground" role="img" aria-label={alt ? `${alt}, no photo` : "No photo"}>
        <Car size={28} strokeWidth={1.5} aria-hidden />
        <span className="text-xs font-medium">No photo</span>
      </div>
    );
  }

  const optimisable = src.startsWith("/") || src.startsWith("https://images.unsplash.com/");

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!optimisable}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
