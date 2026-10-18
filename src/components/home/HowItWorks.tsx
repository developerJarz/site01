import { CalendarCheck, GitCompareArrows, Search, ShieldCheck } from "lucide-react";
import { STEPS } from "./data";
import { SectionHeading } from "./SectionHeading";
import { Stagger, StaggerItem } from "@/components/ui/motion";

import type { HomeSectionConfig, HowItWorksStep } from "@/lib/site-config";

const ICONS = [Search, GitCompareArrows, CalendarCheck, ShieldCheck];

export function HowItWorks({ steps, config }: { steps?: HowItWorksStep[]; config?: HomeSectionConfig }) {
  const eyebrow = config?.eyebrow || "How it works";
  const title = config?.title || "Four steps to your next car";
  const items = steps && steps.length > 0 ? steps : STEPS;

  return (
    <section aria-labelledby="how-heading" className="bg-mist">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <SectionHeading id="how-heading" eyebrow={eyebrow} title={title} description={config?.subtitle} center />
        <div className="relative">
          {/* The rail the steps sit on: horizontal on desktop, vertical on phones. */}
          <div className="absolute left-7 top-7 bottom-7 w-px bg-gradient-to-b from-electric/50 via-electric/25 to-transparent lg:inset-x-[12.5%] lg:bottom-auto lg:h-px lg:w-auto lg:bg-gradient-to-r lg:from-electric/20 lg:via-electric/60 lg:to-electric/20" aria-hidden />
          <Stagger gap={0.05} className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
            {items.map((step, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <StaggerItem key={step.title} className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
                  <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-white text-electric shadow-float">
                    <Icon size={24} aria-hidden />
                    <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-electric text-xs font-bold text-white ring-4 ring-mist tabular">{i + 1}</span>
                  </span>
                  <span className="pt-1 lg:pt-2">
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-slate-text lg:mx-auto">{step.body}</p>
                  </span>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
