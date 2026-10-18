"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CarFront } from "lucide-react";

const START_EVENT = "carhat:navigation-start";
/** Navigations quicker than this (prefetched pages) never show the bar, so it doesn't flash. */
const SHOW_DELAY_MS = 120;
/** Once shown, the bar stays at least this long so it reads as motion, not a flicker. */
const MIN_VISIBLE_MS = 350;
const GIVE_UP_MS = 10_000;

const urlKey = (url: URL) => url.pathname + url.search;

/** Tell the progress bar a navigation is starting. Called for code-driven navigation (router.push). */
export function startRouteProgress(href?: string) {
  if (typeof window === "undefined") return;
  if (href) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin || urlKey(url) === location.pathname + location.search) return;
  }
  window.dispatchEvent(new Event(START_EVENT));
}

/** Drop-in for next/navigation's useRouter whose push/replace also drive the progress bar. */
export function useProgressRouter() {
  const router = useRouter();
  return useMemo(() => ({
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => { startRouteProgress(href); router.push(href, options); },
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => { startRouteProgress(href); router.replace(href, options); },
  }), [router]);
}

/**
 * Top-of-page progress bar with a car riding its tip. Starts on internal link clicks, back/forward and
 * code-driven navigation; finishes when the new URL renders. Purely visual: it does no network work.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<{ show?: ReturnType<typeof setTimeout>; trickle?: ReturnType<typeof setInterval>; hide?: ReturnType<typeof setTimeout>; giveUp?: ReturnType<typeof setTimeout> }>({});
  const shownAt = useRef(0);
  const first = useRef(true);

  const clearAll = useCallback(() => {
    const t = timers.current;
    clearTimeout(t.show); clearInterval(t.trickle); clearTimeout(t.hide); clearTimeout(t.giveUp);
    timers.current = {};
  }, []);

  const finish = useCallback(() => {
    const t = timers.current;
    // Still inside the show delay: the page arrived before the bar appeared, so it never does.
    if (t.show) { clearAll(); return; }
    if (!shownAt.current) return;
    clearInterval(t.trickle); clearTimeout(t.giveUp);
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    t.hide = setTimeout(() => {
      setProgress(100);
      t.hide = setTimeout(() => { setProgress(null); shownAt.current = 0; timers.current = {}; }, 380);
    }, wait);
  }, [clearAll]);

  const start = useCallback(() => {
    clearAll();
    if (shownAt.current) {
      // Already visible (a second click mid-navigation): keep going from where it is.
      shownAt.current = Date.now();
    } else {
      timers.current.show = setTimeout(() => {
        timers.current.show = undefined;
        shownAt.current = Date.now();
        setProgress(12);
      }, SHOW_DELAY_MS);
    }
    // Eases toward 92% and waits there for the page.
    timers.current.trickle = setInterval(() => setProgress((p) => (p === null ? p : p + (92 - p) * 0.07)), 180);
    timers.current.giveUp = setTimeout(finish, GIVE_UP_MS);
  }, [clearAll, finish]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Capture phase: next/link calls preventDefault() for client navigation, so a bubbling listener can't tell.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || urlKey(url) === location.pathname + location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(START_EVENT, start);
    };
  }, [start]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    finish();
  }, [pathname, search, finish]);

  useEffect(() => clearAll, [clearAll]);

  if (progress === null) return null;
  const done = progress >= 100;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90]" role="progressbar" aria-label="Loading page" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
      <div className="h-[3px] origin-left bg-[linear-gradient(90deg,#22b4c4,#0e6aa8_60%,#0a4898)] shadow-[0_0_12px_rgb(34_180_196/0.7)] transition-[transform,opacity] duration-300 ease-out"
        style={{ transform: `scaleX(${progress / 100})`, opacity: done ? 0 : 1, transitionDelay: done ? "0ms, 200ms" : "0ms" }} />
      <span className="absolute top-[3px] flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-brand text-white shadow-glow transition-[left,opacity] duration-300 ease-out"
        style={{ left: `${progress}%`, opacity: done ? 0 : 1, transitionDelay: done ? "0ms, 200ms" : "0ms" }}>
        <CarFront size={12} strokeWidth={2.5} aria-hidden />
      </span>
    </div>
  );
}
