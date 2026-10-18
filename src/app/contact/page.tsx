import Link from "next/link";
import { BadgeCheck, Car, ChevronDown, Flag, KeyRound, Store } from "lucide-react";
import { CONTAINER } from "@/components/ui/page";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/seo/JsonLd";
import { absoluteUrl, loadSeoData } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { ContactForm } from "./ContactForm";

// Contact details come from Admin → Site settings; refresh the structured data hourly.
export const revalidate = 3600;

const HELP = [
  { icon: Car, title: "Buying a car", body: "Questions about a listing, a seller who isn't replying, or what to check before you pay.", href: "/faq#buying-a-car", link: "Buying FAQ" },
  { icon: KeyRound, title: "Selling your car", body: "Help posting your ad, adding photos, pricing your car or uploading papers for the Paper Verified badge.", href: "/sell", link: "Post a free ad" },
  { icon: Store, title: "Dealer partnerships", body: "Showrooms and reconditioned car dealers who want a showroom page and all their leads in one inbox.", href: "/dealers", link: "Dealer partners" },
  { icon: Flag, title: "Report a problem", body: "A suspicious listing, a scam attempt or wrong information. Choose \"Report a listing\" in the form and we'll look into it.", href: "/faq#staying-safe", link: "Safety tips" },
];

const CONTACT_FAQ = [
  { q: "How quickly does CarHat reply?", a: "Our team in Dhaka usually replies the same working day. Messages sent outside our working hours (shown above) are answered on the next working day." },
  { q: "Can CarHat help me with the BRTA name transfer?", a: "We can explain the process and the papers you need. The transfer itself is done by the buyer and seller with BRTA; see our FAQ for the steps." },
  { q: "Can I visit CarHat to see a car?", a: "Cars are kept by their sellers, not at our office. Message the seller from the listing to arrange a viewing somewhere public and in daylight." },
];

export default async function ContactPage() {
  const { globals } = await loadSeoData();
  const pageUrl = absoluteUrl("/contact");

  return (
    <>
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: pageUrl,
          name: "Contact CarHat BD",
          mainEntity: {
            "@type": "Organization",
            "@id": `${absoluteUrl("/")}#organization`,
            name: globals.siteName,
            ...(globals.supportPhone ? { telephone: globals.supportPhone } : {}),
            ...(globals.contactEmail ? { email: globals.contactEmail } : {}),
            ...(globals.address ? { address: { "@type": "PostalAddress", streetAddress: globals.address, addressCountry: "BD" } } : {}),
          },
        },
        breadcrumbLd([{ name: "Home", url: absoluteUrl("/") }, { name: "Contact", url: pageUrl }]),
        faqLd(CONTACT_FAQ),
      ]} />

      <ContactForm />

      <section aria-labelledby="help-heading" className="bg-mist py-16 md:py-20">
        <div className={CONTAINER}>
          <h2 id="help-heading" className="text-[1.9rem] font-extrabold leading-[1.1] text-night md:text-[2.4rem]">How we can help</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HELP.map(({ icon: Icon, title, body, href, link }) => (
              <li key={title} className="flex flex-col rounded-3xl border border-hairline bg-white p-6 shadow-soft">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-haze text-electric"><Icon size={21} aria-hidden /></span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 grow text-[15px] leading-relaxed text-slate-text">{body}</p>
                <Link href={href} className="mt-4 text-sm font-semibold text-electric hover:underline">{link}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="contact-faq-heading" className={cn(CONTAINER, "grid gap-10 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]")}>
        <div>
          <BadgeCheck size={30} className="text-electric" aria-hidden />
          <h2 id="contact-faq-heading" className="mt-3 text-[1.9rem] font-extrabold leading-[1.1] text-night md:text-[2.4rem]">Before you write to us</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-slate-text">
            Many questions about buying and selling cars in Bangladesh are answered in our <Link href="/faq" className="font-semibold text-electric hover:underline">help centre</Link> and{" "}
            <Link href="/blog" className="font-semibold text-electric hover:underline">car buying guides</Link>.
          </p>
        </div>
        <div className="space-y-3">
          {CONTACT_FAQ.map((item) => (
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
    </>
  );
}
