import Image from "next/image";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Brand spinner: a ring in the logo gradient (teal → ocean → navy) that turns while its arc grows and
 * shrinks, around a car mark. Pure SVG + CSS, so it renders from the server with no JavaScript.
 */
export function BrandSpinner({ size = 64, className }: { size?: number; className?: string }) {
  const gradient = `brand-spinner-${size}`;
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }} aria-hidden>
      <span className="spinner-halo absolute inset-[-18%] rounded-full bg-[radial-gradient(closest-side,rgb(34_180_196/0.28),transparent)]" />
      <svg viewBox="0 0 50 50" className="spinner-rotate absolute inset-0 size-full">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22b4c4" />
            <stop offset="55%" stopColor="#0e6aa8" />
            <stop offset="100%" stopColor="#0a4898" />
          </linearGradient>
        </defs>
        <circle cx="25" cy="25" r="20" fill="none" stroke="#e3f2f8" strokeWidth="4" />
        <circle cx="25" cy="25" r="20" fill="none" stroke={`url(#${gradient})`} strokeWidth="4" strokeLinecap="round" className="spinner-arc" />
      </svg>
      <span className="relative flex items-center justify-center rounded-full bg-brand text-white shadow-glow" style={{ width: size * 0.5, height: size * 0.5 }}>
        <CarFront size={Math.round(size * 0.26)} strokeWidth={2.25} />
      </span>
    </span>
  );
}

/** Full-area loading state: spinner, logo, sweeping bar and a shimmering caption. */
export function PageLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex min-h-[60vh] items-center justify-center px-4", className)} role="status" aria-live="polite">
      <div className="flex w-full max-w-[15rem] flex-col items-center text-center">
        <BrandSpinner size={76} />
        <Image src="/car-hat-bd.png" alt="" width={140} height={30} className="mt-6 h-6 w-auto opacity-90" />
        <div className="loader-track mt-4 w-full"><span /></div>
        <p className="mt-3 text-[13px] font-semibold">
          <span className="text-shimmer" aria-hidden>{label}…</span>
          <span className="sr-only">{label}, please wait</span>
        </p>
      </div>
    </div>
  );
}
