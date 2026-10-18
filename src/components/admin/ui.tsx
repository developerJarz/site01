"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Buttons ─────────────────────────────────────── */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const VARIANT: Record<Variant, string> = {
  primary: "bg-electric text-white shadow-glow hover:bg-electric-deep",
  secondary: "border border-hairline bg-white text-night shadow-soft hover:border-[#b8dceb] hover:bg-mist",
  ghost: "text-slate-text hover:bg-mist hover:text-night",
  danger: "bg-destructive text-white hover:bg-[#b91c1c]",
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
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-[background-color,color,box-shadow,border-color] disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.98] motion-reduce:active:scale-100",
        size === "sm" ? "h-9 rounded-lg px-3 text-[13px]" : "h-10 rounded-xl px-4 text-sm",
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
  active: { label: "Live", cls: "bg-verified-soft text-verified", dot: "bg-verified" },
  pending: { label: "Pending review", cls: "bg-warning-soft text-warning", dot: "bg-[#d97706]" },
  sold: { label: "Sold", cls: "bg-haze text-electric-deep", dot: "bg-electric" },
  removed: { label: "Removed", cls: "bg-danger-soft text-destructive", dot: "bg-destructive" },
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
        <h1 className="text-2xl font-extrabold text-night md:text-[1.9rem]">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-slate-text">{description}</p>}
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
    <div role="tablist" aria-label={label} className="scrollbar-none flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-mist p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition-colors",
            value === t.value ? "bg-white text-night shadow-soft" : "text-slate-text hover:text-night"
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-xs tabular", value === t.value ? "bg-haze text-electric-deep" : "bg-white/70")}>
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
    <div className="flex items-center justify-between gap-4 border-t border-hairline px-4 py-3 text-sm">
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
      className="size-[18px] cursor-pointer rounded accent-electric"
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
      <div className="animate-fade absolute inset-0 bg-night/45 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className={cn(
          "animate-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop sm:rounded-3xl",
          { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" }[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-extrabold">{title}</h2>
            {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
          </div>
          <button onClick={onClose} className="-mr-2 flex size-9 items-center justify-center rounded-full text-slate-text hover:bg-mist hover:text-night" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children && <div className="overflow-y-auto px-6 py-5">{children}</div>}
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline bg-mist/60 px-6 py-4">{footer}</div>}
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

/* ─── Switch ──────────────────────────────────────── */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
        checked ? "bg-electric" : "bg-[#94a3b8]"
      )}
    >
      <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200", checked && "translate-x-5")} />
    </button>
  );
}

/** A labelled row with a switch on the right, for on/off settings. */
export function SwitchRow({ title, description, checked, onChange, disabled }: {
  title: string; description?: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-mist/50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-night">{title}</p>
        {description && <p className="mt-0.5 text-[13px] text-slate-text">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

/* ─── Sticky save bar ─────────────────────────────── */
/** Floats at the bottom while there are unsaved changes, so long forms never hide the save button. */
export function SaveBar({ dirty, saving, onSave, onReset, message = "You have unsaved changes" }: {
  dirty: boolean; saving: boolean; onSave: () => void; onReset?: () => void; message?: string;
}) {
  if (!dirty && !saving) return null;
  return (
    <div className="animate-in fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl bg-night p-2.5 pl-4 text-white shadow-pop" role="region" aria-label="Unsaved changes">
      <span className="size-2 shrink-0 rounded-full bg-[#fbbf24]" aria-hidden />
      <p className="mr-auto text-sm font-semibold">{message}</p>
      {onReset && (
        <button type="button" onClick={onReset} disabled={saving} className="h-9 rounded-lg px-3 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50">
          Discard
        </button>
      )}
      <Button variant="primary" size="sm" loading={saving} onClick={onSave}>Save changes</Button>
    </div>
  );
}

/* ─── Misc ────────────────────────────────────────── */
export const inputClass = "field h-11 text-[15px]";

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-text">{hint}</p>}
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

/* ─── Panel ───────────────────────────────────────── */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  flush,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("min-w-0 rounded-3xl border border-hairline bg-white shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-5 md:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-night">{title}</h2>
          {subtitle && <p className="text-[13px] text-slate-text">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={flush ? "mt-3" : "px-5 pb-5 pt-4 md:px-6 md:pb-6"}>{children}</div>
    </section>
  );
}

/* ─── CSV export ──────────────────────────────────── */
/** Downloads rows as a UTF-8 CSV that Excel opens with Bengali text intact. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Cells starting with = + - @ are neutralised so a spreadsheet won't run them as formulas.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
