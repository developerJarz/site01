import { Car, MapPinned, Smile, Store } from "lucide-react";
import { STATS } from "./data";
import { CountUp, Stagger, StaggerItem } from "@/components/ui/motion";

import type { HomeSectionConfig, TrustStatItem } from "@/lib/site-config";

const ICONS: Record<string, typeof Car> = { car: Car, smile: Smile, store: Store, map: MapPinned };

export function TrustStats({ stats, config }: { stats?: TrustStatItem[]; config?: HomeSectionConfig }) {
  const items = stats && stats.length > 0 ? stats : STATS;
  return (
    <section aria-label={config?.title || "CarHat BD in numbers"} className="mx-auto max-w-[1320px] px-4 pt-16 sm:px-6 md:pt-20 lg:px-8">
      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((stat) => {
          const Icon = ICONS[stat.icon] || Car;
          return (
            <StaggerItem key={stat.label} className="group relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-white to-mist p-5 shadow-soft transition-shadow hover:shadow-float sm:p-7">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-electric/[0.06] transition-transform duration-500 group-hover:scale-125" aria-hidden />
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-white text-electric shadow-soft ring-1 ring-electric/10">
                <Icon size={22} aria-hidden />
              </span>
              <p className="relative mt-5 text-[1.9rem] font-extrabold leading-none tracking-tight text-night sm:text-[2.6rem]">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="relative mt-2 text-sm font-medium text-slate-text sm:text-[15px]">{stat.label}</p>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
