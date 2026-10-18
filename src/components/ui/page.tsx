import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** The page width every section uses, matching the header. */
export const CONTAINER = "mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8";

export function Breadcrumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-[13px] font-medium text-slate-text", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="shrink-0 text-slate-text/60" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="truncate transition-colors hover:text-electric">{item.label}</Link>
            ) : (
              <span aria-current="page" className="truncate font-semibold text-night">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The light gradient band that opens every inner page, echoing the homepage hero. */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  children,
  center,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <section className={cn("hero-backdrop relative overflow-hidden border-b border-hairline", className)}>
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className={cn(CONTAINER, "relative py-10 md:py-14")}>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className={cn("mb-5", center && "flex justify-center")} />}
        <div className={cn("flex flex-col gap-6", center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
          <div className={cn("max-w-3xl", center && "mx-auto")}>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className={cn("text-[2.1rem] font-extrabold leading-[1.08] text-night md:text-5xl", eyebrow && "mt-3")}>{title}</h1>
            {description && <div className="mt-4 text-[17px] leading-relaxed text-slate-text">{description}</div>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}

export function SectionTitle({ id, eyebrow, title, description, className }: {
  id?: string; eyebrow?: string; title: React.ReactNode; description?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className={cn("text-2xl font-extrabold text-night md:text-[1.75rem]", eyebrow && "mt-2")}>{title}</h2>
      {description && <p className="mt-2 text-[15px] leading-relaxed text-slate-text">{description}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action, className }: {
  icon?: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-3xl border border-dashed border-hairline bg-white px-6 py-14 text-center", className)}>
      {Icon && <span className="flex size-14 items-center justify-center rounded-2xl bg-haze text-electric"><Icon size={24} aria-hidden /></span>}
      <p className={cn("text-lg font-bold text-night", Icon && "mt-5")}>{title}</p>
      {body && <div className="mt-1.5 max-w-md text-[15px] text-slate-text">{body}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "error", children, className }: { tone?: "error" | "success" | "info"; children: React.ReactNode; className?: string }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-medium",
        tone === "error" && "border-destructive/20 bg-danger-soft text-destructive",
        tone === "success" && "border-verified/20 bg-verified-soft text-verified",
        tone === "info" && "border-electric/20 bg-haze text-electric-deep",
        className
      )}
    >
      {children}
    </div>
  );
}
