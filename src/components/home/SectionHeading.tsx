import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/motion";

export function SectionHeading({ id, eyebrow, title, description, action, center, className }: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  action?: { href: string; label: string };
  center?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cn("mb-10 flex flex-col gap-5 md:mb-12", center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between", className)}>
      <div className={cn("max-w-2xl", center && "mx-auto")}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-electric">{eyebrow}</p>
        <h2 id={id} className="mt-3 text-[2rem] font-extrabold leading-[1.1] text-night md:text-[2.6rem]">{title}</h2>
        {description && <p className="mt-4 text-[17px] leading-relaxed text-slate-text">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="group inline-flex h-11 shrink-0 items-center gap-1.5 self-start rounded-xl text-sm font-semibold text-electric md:self-auto">
          {action.label} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </Reveal>
  );
}
