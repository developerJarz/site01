import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { JsonLd, faqLd } from "@/components/seo/JsonLd";
import { formatLakh } from "@/lib/utils";

export type ModelPrice = { make: string; model: string; count: number; avgPrice: number };

const POPULAR_SEARCHES = [
  { label: "Toyota car price in Bangladesh", href: "/brands/toyota" },
  { label: "Honda car price in BD", href: "/brands/honda" },
  { label: "Nissan cars for sale", href: "/brands/nissan" },
  { label: "Mitsubishi car price", href: "/brands/mitsubishi" },
  { label: "Toyota Axio price", href: "/cars?make=Toyota&model=Axio" },
  { label: "Toyota Premio price", href: "/cars?make=Toyota&model=Premio" },
  { label: "Toyota Allion price", href: "/cars?make=Toyota&model=Allion" },
  { label: "Toyota Noah price", href: "/cars?make=Toyota&model=Noah" },
  { label: "Toyota Corolla price", href: "/cars?make=Toyota&model=Corolla" },
  { label: "Honda Vezel price", href: "/cars?make=Honda&model=Vezel" },
  { label: "Cars under 10 lakh", href: "/cars?maxPrice=1000000" },
  { label: "Cars under 20 lakh", href: "/cars?maxPrice=2000000" },
  { label: "Hybrid car price in Bangladesh", href: "/cars?category=hybrid" },
  { label: "Reconditioned cars", href: "/cars?condition=reconditioned" },
  { label: "Used SUV in Bangladesh", href: "/cars?category=suv" },
  { label: "Used cars in Dhaka", href: "/cars?location=Dhaka" },
  { label: "Used cars in Chattogram", href: "/cars?location=Chattogram" },
  { label: "Paper Verified cars", href: "/cars?verified=1" },
  { label: "Car dealers in Bangladesh", href: "/dealers" },
  { label: "Sell my car", href: "/sell" },
];

export const HOME_FAQ = [
  {
    q: "How much does a used car cost in Bangladesh?",
    a: "It depends mostly on the model, year, mileage and whether the car is locally used or reconditioned. Older sedans such as the Toyota Axio and Allion are usually the most affordable family cars, while newer Premio, Noah and hybrid SUVs cost considerably more. The price table on this page shows the live average asking price for each model listed on CarHat, so you can judge a fair price before you call a seller.",
  },
  {
    q: "Is it better to buy a reconditioned or a used car in Bangladesh?",
    a: "A reconditioned car is imported from Japan with low mileage and has had no owner in Bangladesh, so it costs more but has a cleaner history. A locally used car is cheaper and you can check its service record and BRTA papers with the current owner. Both are listed on CarHat; filter by condition to compare prices.",
  },
  {
    q: "How do I sell my car fast in Bangladesh?",
    a: "Post a free ad on CarHat with 8–10 clear daylight photos, an honest description and a realistic price in lakh. Upload your registration, tax token and fitness papers to earn the Paper Verified badge: verified cars get far more serious enquiries.",
  },
  {
    q: "Which papers should I check before buying a car?",
    a: "Check the BRTA registration certificate (blue book or smart card), a valid tax token, fitness certificate, insurance, and the chassis and engine numbers on the car against the papers. Never pay in full before the BRTA name transfer is agreed.",
  },
  {
    q: "How much does BRTA ownership transfer cost?",
    a: "The BRTA name transfer fee depends on the engine size and is paid with the transfer application, along with any due tax token. Budget for the fee, an updated tax token and a few working days. CarHat's buying guides explain the full process.",
  },
  {
    q: "Is CarHat free for buyers and sellers?",
    a: "Yes. Searching, saving cars, messaging sellers and posting your car are all free, and CarHat takes no commission on your sale.",
  },
];

import type { HomeSectionConfig } from "@/lib/site-config";

/** Long-form, crawlable copy for the homepage: live model prices, popular searches and FAQs. */
export function HomeSeoContent({ models, faqs, config }: { models: ModelPrice[]; faqs?: { q: string; a: string }[]; config?: HomeSectionConfig }) {
  const year = new Date().getFullYear();
  // Questions edited in Admin → Appearance replace the built-in ones.
  const questions = faqs?.length ? faqs : HOME_FAQ;
  const eyebrow = config?.eyebrow || "Car market in Bangladesh";
  const title = config?.title || "Buy and sell cars in Bangladesh with confidence";

  return (
    <section aria-labelledby="seo-heading" className="border-t border-hairline bg-mist/50">
      <JsonLd data={faqLd(questions)} />
      <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="seo-heading" className="mt-3 text-[1.9rem] font-extrabold leading-[1.1] text-night md:text-[2.4rem]">
              {title}
            </h2>
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-slate-text">
              <p>
                CarHat BD is an online car marketplace for Bangladesh where private owners and dealers list used, reconditioned and
                new cars. Compare the <strong className="text-night">car price in Bangladesh</strong> for every make and model, see
                prices the way people say them here (in lakh and crore), and contact sellers directly by message, phone or WhatsApp.
              </p>
              <p>
                Looking for a <Link href="/brands/toyota" className="font-semibold text-electric hover:underline">Toyota</Link> Axio,
                Premio, Allion or Noah, a <Link href="/brands/honda" className="font-semibold text-electric hover:underline">Honda</Link> Vezel
                or Grace, or a family SUV? Filter cars for sale in Dhaka, Chattogram, Sylhet, Rajshahi, Khulna and every other division by
                budget, year, fuel and transmission. Cars whose registration, tax token and fitness papers our team has checked carry the
                Paper Verified badge, and cars priced well below the market average are flagged as Hot Deals.
              </p>
              <p>
                Selling? <Link href="/sell" className="font-semibold text-electric hover:underline">Post a free car ad</Link> in about five
                minutes. Photos are compressed automatically so your ad loads fast on mobile data, and buyers reach you in one inbox.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-night md:text-2xl">Car prices in Bangladesh, {year}</h2>
            <p className="mt-1 text-sm text-slate-text">Average asking price of cars listed on CarHat right now.</p>
            {models.length > 0 ? (
              <div className="mt-5 overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
                <table className="w-full text-left text-[15px]">
                  <thead className="bg-mist text-[13px] uppercase tracking-wide text-slate-text">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Model</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">Average price</th>
                      <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">For sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={`${m.make}-${m.model}`} className="border-t border-hairline">
                        <th scope="row" className="px-4 py-3 font-semibold text-night">
                          <Link href={`/cars?make=${encodeURIComponent(m.make)}&model=${encodeURIComponent(m.model)}`} className="hover:text-electric">
                            {m.make} {m.model} price in Bangladesh
                          </Link>
                        </th>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-night tabular">{formatLakh(m.avgPrice)}</td>
                        <td className="hidden px-4 py-3 text-right text-slate-text tabular sm:table-cell">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-5 rounded-3xl border border-hairline bg-white p-6 text-slate-text">
                Live prices appear here as cars are listed. <Link href="/cars" className="font-semibold text-electric">Browse all cars</Link>.
              </p>
            )}
          </div>
        </div>

        <nav aria-labelledby="popular-heading" className="mt-14">
          <h2 id="popular-heading" className="text-xl font-extrabold text-night md:text-2xl">Popular searches</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="inline-flex h-9 items-center rounded-full border border-hairline bg-white px-3.5 text-sm font-medium text-night transition-colors hover:border-electric/40 hover:text-electric">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-text">
            Browse <Link href="/brands" className="font-semibold text-electric hover:underline">all car brands and prices</Link>.
          </p>
        </nav>

        {/* Full width on desktop: the heading sits beside the questions, which flow in two columns. */}
        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2 className="text-xl font-extrabold text-night md:text-2xl">Buying and selling a car in Bangladesh: common questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-text">
              More answers in our <Link href="/faq" className="font-semibold text-electric hover:underline">help centre</Link> and{" "}
              <Link href="/blog" className="font-semibold text-electric hover:underline">car buying guides</Link>.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:items-start">
            {questions.map((item) => (
              <details key={item.q} className="group min-w-0 rounded-2xl border border-hairline bg-white shadow-soft open:border-electric/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-night [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[16px] leading-snug">{item.q}</h3>
                  <ChevronDown size={18} className="shrink-0 text-slate-text transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="whitespace-pre-line px-5 pb-5 text-[15px] leading-relaxed text-slate-text">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
