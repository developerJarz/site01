import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="hero-backdrop relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative max-w-lg text-center">
        <p className="text-gradient-electric text-[6rem] font-extrabold leading-none md:text-[8rem]">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-night">This page took a wrong turn</h1>
        <p className="mt-3 text-slate-text">The car may have been sold, or the link is out of date. Try searching for something similar.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg"><Link href="/cars"><Search size={17} aria-hidden /> Browse cars</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/">Go home</Link></Button>
        </div>
      </div>
    </div>
  );
}
