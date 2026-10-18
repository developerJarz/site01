import Link from "next/link";
import { Car } from "lucide-react";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { SectionHeading } from "./SectionHeading";

import type { HomeSectionConfig } from "@/lib/site-config";

export function RecentlyListedCars({ cars, config }: { cars: CarCardData[]; config?: HomeSectionConfig }) {
  const eyebrow = config?.eyebrow || "Fresh arrivals";
  const title = config?.title || <>Recently <span className="text-highlight">listed cars</span></>;
  const description = config?.subtitle || "The latest cars added to CarHat, newest first. Find your next car before someone else does.";
  const action = config?.actionLabel && config?.actionHref ? { label: config.actionLabel, href: config.actionHref } : { href: "/cars?sort=newest", label: "View all listings" };

  return (
    <section id="recently-listed" aria-labelledby="recently-listed-heading" className="border-b border-hairline bg-mist/50">
      <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <SectionHeading
          id="recently-listed-heading"
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={action}
        />
        {cars.length ? (
          <Stagger gap={0.05} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cars.map((car) => (
              <StaggerItem key={car._id} className="min-w-0">
                <CarCard car={car} sizes="(min-width: 1320px) 298px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw" />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState icon={Car} title="No recent listings yet" body="New cars will appear here as sellers publish their listings."
            action={<Button asChild><Link href="/sell">List your car</Link></Button>} />
        )}
      </div>
    </section>
  );
}
