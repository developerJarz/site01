"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Buttons ─────────────────────────────────────── */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-[#0a4594]",
  secondary: "border border-input bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
  danger: "bg-destructive text-white hover:bg-[#a82020]",
  success: "bg-verified text-white hover:bg-[#0c6942]",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-[15px]",
        VARIANT[variant],
        className
      )}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ─── Status badges ───────────────────────────────── */
// Status reads by label + dot, never colour alone.
const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  active: { label: "Live", cls: "bg-[#e3f5ec] text-[#0b6b43]", dot: "bg-[#12925a]" },
  pending: { label: "Pending review", cls: "bg-[#fdf3dc] text-[#7a5200]", dot: "bg-[#d99a06]" },
  sold: { label: "Sold", cls: "bg-[#e6eefa] text-primary", dot: "bg-primary" },
  removed: { label: "Removed", cls: "bg-[#fde8e8] text-[#a11d1d]", dot: "bg-destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || { label: status, cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}

export const STATUS_LABEL = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v.label]));

/* ─── Page header ─────────────────────────────────── */
export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-semiwide text-2xl font-extrabold md:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ─── Tabs with counts ────────────────────────────── */
export function CountTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            value === t.value ? "bg-ink text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-xs tabular", value === t.value ? "bg-white/20" : "bg-muted")}>
              {t.count.toLocaleString("en-IN")}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Pagination ──────────────────────────────────── */
export function Pagination({ page, pages, total, onPage, noun }: { page: number; pages: number; total: number; onPage: (p: number) => void; noun: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm">
      <p className="text-muted-foreground tabular">
        {total.toLocaleString("en-IN")} {noun}
        {pages > 1 && `, page ${page} of ${pages}`}
      </p>
      {pages > 1 && (
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
            <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Checkbox (supports the "some selected" state) ─ */
export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-[18px] w-[18px] cursor-pointer rounded accent-primary"
    />
  );
}

/* ─── Modal ───────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Held in a ref so an inline onClose doesn't re-run the effect (and steal focus) on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []).filter(
        (el) => !el.hasAttribute("disabled")
      );
    (focusables().find((el) => el.dataset.autofocus !== undefined) || focusables()[0])?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key === "Tab") {
        const els = focusables();
        if (els.length === 0) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="animate-fade absolute inset-0 bg-ink-deep/60" onClick={onClose} />
      <div
        ref={panelRef}
        className={cn(
          "animate-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-pop sm:rounded-2xl",
          { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" }[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-bold">{title}</h2>
            {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
          </div>
          <button onClick={onClose} className="-mr-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children && <div className="overflow-y-auto px-5 py-5">{children}</div>}
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background/60 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/* ─── Confirm (promise-based, replaces window.confirm) ─ */
interface ConfirmOptions {
  title: string;
  body?: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
}

export function useConfirm() {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...opts, resolve })),
    []
  );

  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };

  const dialog = (
    <Modal
      open={!!state}
      onClose={() => close(false)}
      title={state?.title || ""}
      size="sm"
      footer={
        <>
          <Button onClick={() => close(false)}>Cancel</Button>
          <Button variant={state?.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)} data-autofocus>
            {state?.confirmLabel}
          </Button>
        </>
      }
    >
      {state?.body && <div className="text-[15px] text-muted-foreground">{state.body}</div>}
    </Modal>
  );

  return { confirm, dialog };
}

/* ─── Misc ────────────────────────────────────────── */
export const inputClass =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-[15px] placeholder:text-muted-foreground";

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Reads JSON and throws the server's own error message on failure. */
export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}
