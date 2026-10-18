import Image from "next/image";
import { Bell, Heart, Search, ShieldCheck } from "lucide-react";
import { Float, Reveal } from "@/components/ui/motion";

const PERKS = [
  { icon: Bell, text: "Instant alerts for new cars and price drops" },
  { icon: Heart, text: "Your wishlist, synced across devices" },
  { icon: ShieldCheck, text: "Chat with sellers safely in the app" },
];

function AppleLogo() {
  return <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden><path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.97-3.46-1.07-1.57-2.74-1.78-3.33-1.8-1.42-.14-2.77.84-3.49.84-.72 0-1.83-.82-3.01-.8-1.55.02-2.98.9-3.78 2.28-1.61 2.8-.41 6.94 1.16 9.2.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 2.99-.75 1.4 0 1.79.75 3.01.73 1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.53 1.26-2.6-.03-.01-2.42-.93-2.45-3.7zM14.08 5.87c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.1 1.77-.97 2.82 1.03.08 2.07-.52 2.71-1.28z" /></svg>;
}

function PlayLogo() {
  return <svg viewBox="0 0 24 24" className="size-6" aria-hidden><path fill="#00d7fe" d="M3.6 1.8 13.4 12l-9.8 10.2c-.35-.2-.6-.6-.6-1.1V2.9c0-.5.25-.9.6-1.1z" /><path fill="#ffce00" d="m16.8 8.6 3.4 1.95c1.05.6 1.05 2.3 0 2.9l-3.4 1.95L13.4 12z" /><path fill="#00f076" d="M3.6 1.8c.33-.2.77-.22 1.17 0l12.03 6.8-3.4 3.4z" /><path fill="#f63448" d="m13.4 12 3.4 3.4-12.03 6.8c-.4.22-.84.2-1.17 0z" /></svg>;
}

import type { AppPromoConfig, HomeSectionConfig } from "@/lib/site-config";

export function AppPromo({ config, promo }: { config?: HomeSectionConfig; promo?: AppPromoConfig }) {
  const eyebrow = config?.eyebrow || "Mobile app";
  const title = config?.title || "CarHat BD in your pocket";
  const subtitle = config?.subtitle || "Browse, save and chat with sellers wherever you are. The app is on its way.";
  const appStoreHref = promo?.appStoreUrl;
  const playStoreHref = promo?.playStoreUrl;
  const mockupImage = promo?.mockupUrl || config?.imageUrl || "/images/home/app-car.jpg";

  return (
    <section aria-labelledby="app-heading" className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6 md:pb-28 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-[36px] bg-gradient-to-br from-electric via-[#0a6dff] to-electric-light px-6 pt-14 text-white sm:px-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-16 lg:pt-0">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_80%_20%,rgb(255_255_255/0.25),transparent_60%)]" aria-hidden />
        <Reveal className="lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">{eyebrow}</p>
          <h2 id="app-heading" className="mt-3 text-4xl font-extrabold leading-[1.08] md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-lg text-white">{subtitle}</p>
          <ul className="mt-7 space-y-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-white">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><Icon size={17} aria-hidden /></span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            {[
              { logo: <AppleLogo />, small: appStoreHref ? "Download on the" : "Coming soon on the", big: "App Store", href: appStoreHref },
              { logo: <PlayLogo />, small: playStoreHref ? "Get it on" : "Coming soon on", big: "Google Play", href: playStoreHref }
            ].map((b) => (
              b.href ? (
                <a key={b.big} href={b.href} target="_blank" rel="noopener noreferrer" className="flex h-14 items-center gap-3 rounded-2xl bg-night px-5 text-white shadow-float transition-transform hover:-translate-y-0.5">
                  {b.logo}
                  <span className="leading-tight">
                    <span className="block text-[11px] text-white/85">{b.small}</span>
                    <span className="block text-[17px] font-semibold">{b.big}</span>
                  </span>
                </a>
              ) : (
                <div key={b.big} className="flex h-14 items-center gap-3 rounded-2xl bg-night px-5 text-white shadow-float" aria-label={`${b.big}: coming soon`} role="img">
                  {b.logo}
                  <span className="leading-tight">
                    <span className="block text-[11px] text-white/85">{b.small}</span>
                    <span className="block text-[17px] font-semibold">{b.big}</span>
                  </span>
                </div>
              )
            ))}
          </div>
        </Reveal>

        {/* Phone mockup */}
        <div className="relative mx-auto mt-12 h-[26rem] w-[17rem] sm:h-[30rem] lg:mt-0 lg:h-[34rem] lg:w-[19rem] lg:self-end">
          <Reveal y={80} aria-hidden className="absolute inset-x-0 top-0 bottom-[-4rem] rounded-[3rem] border-[10px] border-night bg-night shadow-[0_50px_100px_-30px_rgb(11_29_54/0.6)]">
            <div className="relative h-full overflow-hidden rounded-[2.3rem] bg-white">
              <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-night" aria-hidden />
              <div className="px-4 pt-11 text-night">
                <p className="text-[11px] font-semibold text-slate-text">Good morning</p>
                <p className="text-lg font-extrabold leading-tight">Find your next car</p>
                <div className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-mist px-3 text-xs text-slate-text"><Search size={14} aria-hidden /> Search cars, brands…</div>
                <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image src={mockupImage} alt="" fill sizes="240px" className="object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-verified">Verified</span>
                </div>
                <p className="mt-2.5 text-sm font-bold">Toyota RAV4 2021</p>
                <p className="price-tag text-base text-electric">৳ 52 lakh</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {["SUV", "Sedan", "Hybrid"].map((c) => <span key={c} className="rounded-lg bg-haze py-1.5 text-center text-[10px] font-semibold text-electric">{c}</span>)}
                </div>
              </div>
            </div>
          </Reveal>
          <Float aria-hidden className="absolute -left-40 top-1/2 hidden items-center gap-2 rounded-2xl border border-white/40 bg-white/80 px-3 py-2.5 text-night shadow-float backdrop-blur-xl sm:flex">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#e3f5ec] text-verified"><Bell size={15} aria-hidden /></span>
            <span className="text-xs font-semibold">Price dropped 2 lakh</span>
          </Float>
        </div>
      </div>
    </section>
  );
}
