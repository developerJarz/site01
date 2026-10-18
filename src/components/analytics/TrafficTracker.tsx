"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { TrafficEvent } from "@/lib/analytics-request";

let fallbackVisitor = "";
let fallbackSession = "";
function identity(storage: Storage, key: string, fallback: string) {
  try {
    const value = storage.getItem(key) || fallback;
    storage.setItem(key, value);
    return value;
  } catch { return fallback; }
}

/** Small batches, visible cards only, no third-party SDK or personal information. */
export function TrafficTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || /^\/(admin|dashboard|profile|login|register|sell)(\/|$)/.test(pathname) || navigator.doNotTrack === "1") return;
    fallbackVisitor ||= crypto.randomUUID();
    fallbackSession ||= crypto.randomUUID();
    let visitor = fallbackVisitor;
    let session = fallbackSession;
    try {
      visitor = identity(localStorage, "carhat:visitor", fallbackVisitor);
      session = identity(sessionStorage, "carhat:visit", fallbackSession);
    } catch { /* Storage restrictions should never interrupt browsing. */ }
    const queued: TrafficEvent[] = [];
    const seen = new Set<string>();
    let flushTimer: ReturnType<typeof setTimeout> | undefined;
    const payload = (events: TrafficEvent[]) => JSON.stringify({ visitor, session, events });
    const flush = () => {
      clearTimeout(flushTimer);
      while (queued.length) {
        const events = queued.splice(0, 20);
        void fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload(events), keepalive: true }).catch(() => {});
      }
    };
    const enqueue = (event: TrafficEvent) => {
      const key = `${event.kind}:${event.listingId || event.path}`;
      if (seen.has(key)) return;
      seen.add(key);
      queued.push(event);
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 800);
      if (queued.length >= 20) flush();
    };
    enqueue({ kind: "page_view", path: pathname });
    const dwell = new Map<Element, ReturnType<typeof setTimeout>>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        clearTimeout(dwell.get(entry.target));
        dwell.delete(entry.target);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          dwell.set(entry.target, setTimeout(() => {
            const listingId = (entry.target as HTMLElement).dataset.listingId;
            if (listingId && document.visibilityState === "visible") enqueue({ kind: "impression", listingId, path: pathname });
            dwell.delete(entry.target);
          }, 1000));
        }
      }
    }, { threshold: [0, 0.5] });
    const observed = new WeakSet<Element>();
    const scan = () => document.querySelectorAll("[data-listing-id]").forEach((el) => {
      if (!observed.has(el)) { observed.add(el); observer.observe(el); }
    });
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest<HTMLAnchorElement>("a[href]");
      const listingId = anchor?.closest<HTMLElement>("[data-listing-id]")?.dataset.listingId;
      if (anchor && listingId && new URL(anchor.href).pathname.startsWith("/cars/")) {
        enqueue({ kind: "click", listingId, path: pathname });
        flush();
      }
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") {
        dwell.forEach(clearTimeout);
        dwell.clear();
        flush();
      }
    };
    document.addEventListener("click", click, true);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", flush);
    return () => {
      observer.disconnect(); mutations.disconnect(); dwell.forEach(clearTimeout); flush();
      document.removeEventListener("click", click, true);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);
  return null;
}
