"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="hero-backdrop flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white text-warning shadow-soft"><TriangleAlert size={28} aria-hidden /></span>
        <h1 className="mt-6 text-3xl font-extrabold text-night">Something went wrong</h1>
        <p className="mt-2 text-slate-text">This page hit a problem loading. It&apos;s usually brief, so try again.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-slate-text">Ref: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={() => unstable_retry()}><RotateCcw size={17} aria-hidden /> Try again</Button>
          <Button asChild size="lg" variant="secondary"><Link href="/">Go home</Link></Button>
        </div>
      </div>
    </div>
  );
}
