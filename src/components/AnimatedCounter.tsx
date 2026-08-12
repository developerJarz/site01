"use client";

import { useEffect, useState, useRef } from "react";

interface CounterProps {
  end: number;
  suffix?: string;
  label: string;
  dark?: boolean;
}

export function AnimatedCounter({ end, suffix = "", label, dark = false }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = end / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <p className={`text-4xl md:text-5xl font-extrabold tabular-nums price-tag ${
        dark ? "text-white" : "text-primary"
      }`}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className={`text-sm mt-2 font-semibold ${
        dark ? "text-slate-200" : "text-muted-foreground"
      }`}>
        {label}
      </p>
    </div>
  );
}
