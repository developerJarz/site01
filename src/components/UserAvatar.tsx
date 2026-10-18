"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function UserAvatar({ src, name, size = 80, className }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <span style={{ width: size, height: size }} className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric to-electric-light font-bold text-white", className)}>
      {src && failedSrc !== src ? (
        <Image src={src} alt={`${name || "Your"} profile photo`} fill sizes={`${size}px`} unoptimized={!src.startsWith("https://res.cloudinary.com/")} onError={() => setFailedSrc(src)} className="object-cover" />
      ) : <span aria-hidden>{name?.[0]?.toUpperCase() || "U"}</span>}
    </span>
  );
}
