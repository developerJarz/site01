"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, MotionConfig, useInView, useReducedMotion, type HTMLMotionProps } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Honours the OS reduced-motion setting for every Framer animation below it (transforms off, fades kept). */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ delay = 0, y = 24, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...props}
    />
  );
}

/** A list whose items (StaggerItem) arrive one after another. */
export function Stagger({ gap = 0.05, ...props }: HTMLMotionProps<"ul"> & { gap?: number }) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      {...props}
    />
  );
}

export function StaggerItem(props: HTMLMotionProps<"li">) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      variants={{
        hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      {...props}
    />
  );
}

/** Gentle bob for floating glass cards. It settles after a few cycles: endless decorative motion distracts. */
export function Float({ delay = 0, distance = 10, ...props }: HTMLMotionProps<"div"> & { delay?: number; distance?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -distance, 0] }}
      transition={{ duration: 6, repeat: 2, ease: "easeInOut", delay }}
      {...props}
    />
  );
}

/** Counts up from zero once visible. The final figure is server-rendered for crawlers and no-JS. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState<number | null>(null);

  // Reset to zero on hydration so the count starts from nothing rather than jumping back.
  useEffect(() => {
    if (!reduce) setShown((n) => n ?? 0);
  }, [reduce]);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  const display = (shown ?? value).toLocaleString("en-IN");
  return (
    <span ref={ref} className="tabular">
      <span aria-hidden>{display}{suffix}</span>
      <span className="sr-only">{value.toLocaleString("en-IN")}{suffix}</span>
    </span>
  );
}
