"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Share sheet dismissed; fall through to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <button type="button" onClick={share}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-hairline bg-white px-4 text-sm font-semibold text-night transition-colors hover:bg-mist">
      {copied ? <Check size={17} className="text-verified" aria-hidden /> : <Share2 size={17} aria-hidden />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
