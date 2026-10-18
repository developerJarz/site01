"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

export function useScroll(threshold = 10) {
  return useSyncExternalStore(subscribe, () => window.scrollY > threshold, () => false);
}
