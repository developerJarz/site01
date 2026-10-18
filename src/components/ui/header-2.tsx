"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { useScroll } from "@/components/ui/use-scroll";

/** Floating header shell; navigation and account actions belong to the caller. */
export function Header({ className, children, ...props }: ComponentProps<"header">) {
  const scrolled = useScroll(10);

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        "fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-[1320px] border-b border-transparent bg-white/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/75 md:rounded-2xl md:border motion-safe:transition-[max-width,top,background-color,box-shadow,border-color] motion-safe:duration-300 motion-safe:ease-out",
        scrolled
          ? "border-border bg-white/95 shadow-soft md:top-4 md:w-[calc(100%-2rem)] md:max-w-[1240px] md:shadow-float"
          : "md:top-3 md:w-[calc(100%-3rem)] md:border-white/80 md:shadow-soft",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}
