import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function MenuToggleIcon({ open, duration = 300, className, ...props }: ComponentProps<"svg"> & { open: boolean; duration?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className={cn("size-5", className)} {...props}>
      <path d="M4 8h16" className="origin-center transition-transform motion-reduce:transition-none" style={{ transitionDuration: `${duration}ms`, transform: open ? "translateY(4px) rotate(45deg)" : undefined }} />
      <path d="M4 16h16" className="origin-center transition-transform motion-reduce:transition-none" style={{ transitionDuration: `${duration}ms`, transform: open ? "translateY(-4px) rotate(-45deg)" : undefined }} />
    </svg>
  );
}
