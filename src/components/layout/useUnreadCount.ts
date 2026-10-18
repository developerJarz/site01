"use client";

import { useEffect, useState } from "react";

/** Unread message count, polled every 30s while the tab is visible. */
export function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/conversations/unread");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.unreadCount === "number") setCount(data.unreadCount);
      } catch {
        // offline or signed out; the badge just stays as it was
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", load);
    };
  }, [enabled]);

  return count;
}
