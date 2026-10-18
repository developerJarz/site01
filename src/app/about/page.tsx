import type { Metadata } from "next";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Car, FileCheck2, Headset, KeyRound, MapPinned, ScanSearch, ShieldCheck, Smile, Store, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTAINER, PageHero } from "@/components/ui/page";
import { CountUp } from "@/components/ui/motion";
import { FEATURES, PAPERS, STATS, STEPS } from "@/components/home/data";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/about");

// Static page: rebuilt hourly, or immediately when its SEO is edited in the admin.
export const revalidate = 3600;

const STAT_ICONS = { car: Car, smile: Smile, store: Store, map: MapPinned };
const FEATURE_ICONS = { shield: ShieldCheck, search: ScanSearch, tag: Tag, headset: Headset };

const AUDIENCES = [
  {
    icon: Car,
    title: "For car buyers",
    body: "Search used, reconditioned and new cars for sale in Bangladesh by budget, brand, body type, fuel and city. Compare up to three cars side by side, see the live average price for each model, and message sellers without sharing your number.",
    link: { href: "/cars", label: "Browse cars for sale" },
  },
  {
    icon: KeyRound,
    title: "For car sellers",
    body: "Post a free car ad in about five minutes. Photos are compressed automatically so your ad loads fast on mobile data, buyers reach you in one inbox, and uploading your papers earns the Paper Verified badge serious buyers look for.",
    link: { href: "/sell", label: "Sell your car free" },
  },
  {
    icon: Store,
    title: "For dealers and showrooms",
    body: "Reconditioned car showrooms and dealers get a public showroom page, every enquiry in one place, and views, saves and chats for each car, so you can see which stock is moving.",
    link: { href: "/dealers", label: "See dealer partners" },
  },
];

const CITIES = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh", "Cumilla", "Gazipur", "Narayanganj", "Bogura"];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Home", url: absoluteUrl("/") }, { name: "About CarHat BD", url: absoluteUrl("/about") }]),
        { "@context": "https://schema.org", "@type": "AboutPage", url: absoluteUrl("/about"), name: "About CarHat BD", about: { "@id": `${absoluteUrl("/")}#organization` } },
      ]} />
      <PageHero
        eyebrow="About CarHat BD"
        title={<>The safer way to buy and sell cars in <span className="text-gradient-electric">Bangladesh</span></>}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        description="We started CarHat because buying a used car in Bangladesh meant chasing papers, guessing prices and hoping for the best. We're fixing that, one checked listing at a time."
      />

      <section aria-label="CarHat in numbers" className={cn(CONTAINER, "-mt-px py-12")}>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => {
            const Icon = STAT_ICONS[s.icon];
            return (
              <li key={s.label} className="rounded-3xl border border-hairline bg-white p-6 shadow-soft">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-haze text-electric"><Icon size={21} aria-hidden /></span>
                <p className="mt-5 text-3xl font-extrabold text-night md:text-4xl"><CountUp value={s.value} suffix={s.suffix} /></p>
                <p className="mt-1 text-sm font-medium text-slate-text">{s.label}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="story-heading" className={cn(CONTAINER, "grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2")}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-mist shadow-float">
          <Image src="/images/home/sell-banner.jpg" alt="Car keys handed over after a used car sale in Dhaka" fill sizes="(min-width: 1024px) 50vw, 92vw" className="object-cover" />
        </div>
        <div>
          <p className="eyebrow">Our story</p>
          <h2 id="story-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">Trust is the whole product</h2>
          <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-slate-text">
            <p>Every part of CarHat is built around one question: can you trust this car? That&apos;s why sellers can upload their registration, tax token and fitness papers, and why our team checks them before a listing earns the Paper Verified badge.</p>
            <p>Prices are shown the way people here say them, in lakh and crore, and cars that sit well below their market price are flagged as Hot Deals. Buyers and sellers talk in one inbox, so nothing gets lost.</p>
            <p>From Dhaka to Chattogram and Sylhet, private owners and dealers list with us every day. Whether you want a fuel-saving hybrid for city traffic, a seven-seat family microbus or your first car under 10 lakh, CarHat helps you find a fair price and buy with confidence.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild size="lg"><Link href="/cars">Browse cars <ArrowRight size={17} aria-hidden /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/contact">Talk to us</Link></Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="who-heading" className={cn(CONTAINER, "pb-16 md:pb-24")}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">What we do</p>
          <h2 id="who-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">One car marketplace for buyers, sellers and dealers</h2>
        </div>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, body, link }) => (
            <li key={title} className="flex flex-col rounded-3xl border border-hairline bg-white p-7 shadow-soft">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-haze text-electric"><Icon size={23} aria-hidden /></span>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-2 grow text-[15px] leading-relaxed text-slate-text">{body}</p>
              <Link href={link.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-electric hover:underline">{link.label} <ArrowRight size={15} aria-hidden /></Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="values-heading" className="bg-mist py-16 md:py-24">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What we stand for</p>
            <h2 id="values-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">Why people choose CarHat</h2>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = FEATURE_ICONS[f.icon];
              return (
                <li key={f.title} className="rounded-3xl border border-hairline bg-white p-7 shadow-soft">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-electric-light text-white shadow-glow"><Icon size={26} aria-hidden /></span>
                  <h3 className="mt-6 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-text">{f.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-labelledby="papers-heading" className={cn(CONTAINER, "grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:items-center")}>
        <div>
          <p className="eyebrow">Paper Verified</p>
          <h2 id="papers-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">How we check car papers</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-slate-text">
            Fake or incomplete papers are one of the biggest risks when you buy a second-hand car in Bangladesh. Sellers upload their documents
            privately, and our team checks each one against the listing before the car earns the <strong className="text-night">Paper Verified</strong> badge.
            Buyers see only the badge, never the documents. It is a paper check, not a mechanical inspection, so always see the car and the originals in person.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PAPERS.map((p) => (
            <li key={p.name} className="rounded-2xl border border-hairline bg-white p-5 shadow-soft">
              <FileCheck2 size={20} className="text-verified" aria-hidden />
              <h3 className="mt-3 font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-text">{p.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className={cn(CONTAINER, "pb-16 md:pb-24")}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="mt-3 text-[2rem] font-extrabold leading-[1.1] md:text-[2.6rem]">Four steps to your next car</h2>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-3xl border border-hairline bg-white p-7 shadow-soft">
              <span className="flex size-11 items-center justify-center rounded-full bg-night text-sm font-extrabold text-white tabular">{i + 1}</span>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-text">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="cities-heading" className="bg-mist py-16 md:py-20">
        <div className={cn(CONTAINER, "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center")}>
          <div>
            <p className="eyebrow">Across Bangladesh</p>
            <h2 id="cities-heading" className="mt-3 text-[1.9rem] font-extrabold leading-[1.1] md:text-[2.4rem]">Used cars for sale in every division</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-slate-text">Most cars are listed in Dhaka and Chattogram, but buyers and sellers use CarHat across the country.</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <li key={c}>
                <Link href={`/cars?location=${encodeURIComponent(c)}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-hairline bg-white px-4 text-sm font-semibold text-night shadow-soft hover:border-electric/40 hover:text-electric">
                  <MapPinned size={15} className="text-electric" aria-hidden /> Cars in {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="cta-heading" className={cn(CONTAINER, "py-16 md:py-24")}>
        <div className="rounded-[32px] bg-night px-6 py-12 text-center text-white md:px-12">
          <BadgeCheck size={36} className="mx-auto text-electric-light" aria-hidden />
          <h2 id="cta-heading" className="mt-4 text-[1.9rem] font-extrabold leading-[1.1] md:text-[2.4rem]">Ready to find your next car?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">Browse cars for sale across Bangladesh, or post your own car free in five minutes.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg"><Link href="/cars">Browse cars <ArrowRight size={17} aria-hidden /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/sell">Sell your car</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
