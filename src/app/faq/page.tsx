import type { Metadata } from "next";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTAINER, PageHero } from "@/components/ui/page";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/faq");

// Static page: rebuilt hourly, or immediately when its SEO is edited in the admin.
export const revalidate = 3600;

const FAQS = [
  {
    category: "Getting started",
    items: [
      { q: "Is CarHat free to use?", a: "Yes. Browsing, saving cars, messaging sellers and posting your car are all free. We don't take a commission on your sale." },
      { q: "What is CarHat BD?", a: "CarHat BD is an online car marketplace for Bangladesh. Private owners and dealers list used, reconditioned and new cars, and buyers search, compare prices and contact sellers directly." },
      { q: "How do I create an account?", a: "Tap Login, then Create a free account. Enter your name, email and a password, and we'll email you a 6-digit code to confirm your address." },
      { q: "Does CarHat work on my phone?", a: "Yes. The whole site is built for phones first, with a bottom bar for search, saved cars and posting a listing. Photos are compressed so pages load quickly on mobile data." },
      { q: "Which cities does CarHat cover?", a: "All of Bangladesh. Most cars are listed in Dhaka and Chattogram, with sellers in Sylhet, Rajshahi, Khulna, Barishal, Rangpur, Mymensingh and other districts too. Filter by location to see cars near you." },
    ],
  },
  {
    category: "Buying a car",
    items: [
      { q: "How do I find the right price for a car?", a: "Every brand page shows the live average asking price for each model on CarHat, and cars priced well below their model's average are marked Hot Deal. Compare a few cars of the same model, year and mileage before you make an offer." },
      { q: "How do I contact a seller?", a: "Open the car and use Message the seller, Show phone number or WhatsApp. Sellers choose which of these to offer. You need to be signed in to message." },
      { q: "What does Paper Verified mean?", a: "The seller uploaded the car's registration certificate, tax token and fitness certificate, and our team checked them against the listing. It isn't a mechanical inspection, so still see the car and the original papers in person." },
      { q: "What is the difference between a reconditioned and a used car?", a: "A reconditioned (recon) car is imported, usually from Japan, and has not been registered to an owner in Bangladesh before. A used car has already been registered and driven here. Recon cars usually cost more and have lower mileage; locally used cars are cheaper and you can ask the current owner about the car's history." },
      { q: "What is a Hot Deal?", a: "A car priced at least 10% below the average asking price of the same make and model on CarHat, when there are enough similar cars to compare against." },
      { q: "Can I compare cars?", a: "Yes. Tap the compare button on up to three cars, then open Compare from the menu to see price, mileage, papers and seller side by side." },
      { q: "Can I negotiate the price?", a: "Most sellers expect to. Message them through CarHat so you keep a record of what was agreed." },
      { q: "Can I get a car loan through CarHat?", a: "CarHat doesn't lend money. Most banks and non-bank financial institutions in Bangladesh offer car loans for new and reconditioned cars, and some for used cars. Ask your bank about the down payment, interest rate and which papers they need from the seller before you agree a price." },
    ],
  },
  {
    category: "Papers and BRTA transfer",
    items: [
      { q: "Which papers should I check before buying a used car in Bangladesh?", a: "The BRTA registration certificate (smart card or blue book), a valid tax token, fitness certificate, insurance, and the seller's national ID. Match the chassis and engine numbers on the car with the registration papers." },
      { q: "How does the BRTA name transfer (ownership transfer) work?", a: "Buyer and seller sign the transfer forms, the seller provides the original papers and a sale certificate, and the transfer application is submitted to BRTA with the fee and any due tax. Agree in writing who pays the fees and when the full payment is made." },
      { q: "When should I pay the seller?", a: "Only after you have inspected the car and the original papers, and agreed how the BRTA name transfer will be done. Never send an advance to a seller you haven't met." },
      { q: "What if the tax token or fitness has expired?", a: "You can still buy the car, but you'll need to renew them, and unpaid tax may be added to the transfer. Agree with the seller who pays before you settle the price." },
    ],
  },
  {
    category: "Selling a car",
    items: [
      { q: "How do I post my car?", a: "Sign in and tap Post Listing. Add the make, model and year, your price and description, then photos and (ideally) your papers. It takes about five minutes." },
      { q: "How do I sell my car fast?", a: "Price it close to the model's average on CarHat, add 8–10 clear daylight photos (front, back, both sides, dashboard, seats and engine), write an honest description, and upload your papers for the Paper Verified badge." },
      { q: "When does my listing go live?", a: "Depending on our current review settings, your car goes live straight away or after a quick check by our team. Your dashboard shows its status." },
      { q: "How many photos can I add?", a: "Up to 10. They're compressed automatically into a modern format, so they look sharp but load quickly for buyers on mobile data." },
      { q: "Who can see my car papers?", a: "Only the CarHat team. Papers are stored privately, used to award the Paper Verified badge and never shown on your listing." },
      { q: "I sold my car. What now?", a: "Open your dashboard and tap Mark sold. Buyers will see it's sold, and you can relist it any time." },
    ],
  },
  {
    category: "Dealers",
    items: [
      { q: "Can car dealers and showrooms list on CarHat?", a: "Yes. Dealers get a showroom page with all their stock, enquiries in one inbox and views and saves for each car. Contact us to set up a dealer account." },
      { q: "Is there a limit on how many cars a dealer can list?", a: "No fixed limit for verified dealers. Each listing still needs real photos of the actual car and an honest description." },
    ],
  },
  {
    category: "Staying safe",
    items: [
      { q: "How do I avoid car scams in Bangladesh?", a: "Never send an advance to someone you haven't met. Meet in daylight somewhere public, have a mechanic inspect the car, check the chassis number against the registration papers, and be wary of prices that look far too low." },
      { q: "How do I report a suspicious listing?", a: "Use Report this listing on the car's page, or contact us. Our team reviews every report." },
      { q: "Does CarHat inspect cars?", a: "Our team checks papers for the Paper Verified badge. We recommend a pre-purchase inspection by a mechanic you trust before you buy any car." },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <JsonLd data={[
        faqLd(FAQS.flatMap((s) => s.items)),
        breadcrumbLd([{ name: "Home", url: absoluteUrl("/") }, { name: "Help and FAQ", url: absoluteUrl("/faq") }]),
      ]} />
      <PageHero eyebrow="Help centre" title="Buying and selling a car in Bangladesh: FAQ" center
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Help and FAQ" }]}
        description="Everything about buying, selling, papers, BRTA transfer and staying safe on CarHat BD." />

      <div className={cn(CONTAINER, "grid gap-10 py-12 md:py-16 lg:grid-cols-[16rem_minmax(0,1fr)]")}>
        <nav aria-label="Topics" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 rounded-3xl border border-hairline bg-white p-3 shadow-soft">
            {FAQS.map((s) => (
              <li key={s.category}>
                <a href={`#${slug(s.category)}`} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-text hover:bg-mist hover:text-night">{s.category}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl space-y-12">
          {FAQS.map((section) => (
            <section key={section.category} id={slug(section.category)} aria-labelledby={`${slug(section.category)}-h`} className="scroll-mt-36">
              <h2 id={`${slug(section.category)}-h`} className="text-2xl font-extrabold">{section.category}</h2>
              <div className="mt-5 space-y-3">
                {section.items.map((item) => (
                  <details key={item.q} className="group rounded-2xl border border-hairline bg-white shadow-soft open:border-electric/20">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-night [&::-webkit-details-marker]:hidden">
                      <h3 className="text-[16px]">{item.q}</h3>
                      <ChevronDown size={18} className="shrink-0 text-slate-text transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-slate-text">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="flex flex-col items-start gap-4 rounded-3xl border border-hairline bg-gradient-to-br from-mist via-white to-haze p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Still need help?</h2>
              <p className="mt-1 text-slate-text">Our team in Dhaka usually replies the same working day. Or read our <Link href="/blog" className="font-semibold text-electric">car buying guides</Link>.</p>
            </div>
            <Button asChild size="lg"><Link href="/contact"><MessageCircle size={17} aria-hidden /> Contact us</Link></Button>
          </div>
        </div>
      </div>
    </>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
