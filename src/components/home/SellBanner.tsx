import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, Clock, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { DEFAULT_APPEARANCE, type AppearanceSettings } from "@/lib/site-config";

const POINTS = [
  { icon: Clock, text: "Listed in about five minutes" },
  { icon: Camera, text: "Free listing with photos" },
  { icon: Users, text: "Thousands of verified buyers" },
];

/** next/image only optimises our own files and Cloudinary; any other admin-pasted URL is shown as-is. */
const optimisable = (src: string) => src.startsWith("/") || src.startsWith("https://res.cloudinary.com/");

export function SellBanner({ banner = DEFAULT_APPEARANCE.sellBanner }: { banner?: AppearanceSettings["sellBanner"] }) {
  const image = banner.imageUrl || DEFAULT_APPEARANCE.sellBanner.imageUrl;
  return (
    <section aria-labelledby="sell-heading" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
      <Reveal className="relative isolate overflow-hidden rounded-[32px] bg-night text-white shadow-float">
        <Image src={image} alt="" fill sizes="(min-width: 1320px) 1272px, 100vw" unoptimized={!optimisable(image)} className="-z-10 object-cover object-[70%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night via-night/85 to-night/10 max-md:bg-night/75" aria-hidden />
        <div className="absolute -left-24 -top-24 -z-10 size-72 rounded-full bg-electric/40 blur-3xl" aria-hidden />

        <div className="max-w-xl px-6 py-14 sm:px-10 md:py-20 lg:px-16 lg:py-24">
          {banner.eyebrow && (
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">
              {banner.eyebrow}
            </p>
          )}
          <h2 id="sell-heading" className="mt-5 text-4xl font-extrabold leading-[1.05] md:text-[3.25rem]">{banner.title}</h2>
          {banner.subtitle && <p className="mt-5 text-lg leading-relaxed text-white/80">{banner.subtitle}</p>}
          <ul className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-white/85 sm:flex-col sm:items-start">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur"><Icon size={17} aria-hidden /></span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {banner.ctaLabel && banner.ctaHref && (
              <Button asChild size="lg" className="group">
                <Link href={banner.ctaHref}>{banner.ctaLabel} <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden /></Link>
              </Button>
            )}
            {banner.secondaryLabel && banner.secondaryHref && (
              <Button asChild size="lg" variant="glass">
                <Link href={banner.secondaryHref}><Phone size={17} aria-hidden /> {banner.secondaryLabel}</Link>
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
