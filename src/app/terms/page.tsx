import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/ui/legal";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/terms");

// Static page: rebuilt hourly, or immediately when its SEO is edited in the admin.
export const revalidate = 3600;

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      updated="October 2026"
      intro={
        <p>
          These terms apply to everyone who uses CarHat BD to browse, buy, sell or list cars in Bangladesh. By using the site you agree to them.
          If you don&apos;t agree, please don&apos;t use CarHat. Please also read our <Link href="/privacy">privacy policy</Link>.
        </p>
      }
      sections={[
        {
          id: "service",
          title: "What CarHat is",
          body: (
            <p>
              CarHat BD is an online marketplace that connects people who want to buy cars with private sellers and dealers. We publish listings,
              provide messaging and tools to compare cars, and check uploaded papers for the Paper Verified badge. We do not own, inspect, buy or sell
              the cars listed, and we are not an agent for either side of a sale.
            </p>
          ),
        },
        {
          id: "eligibility",
          title: "Who can use CarHat",
          body: <p>You must be at least 18 years old and able to enter into a legally binding agreement in Bangladesh to post a listing or contact a seller. Dealers must be legally registered to trade.</p>,
        },
        {
          id: "accounts",
          title: "Your account",
          body: (
            <ul>
              <li>Give accurate details when you sign up and keep them up to date.</li>
              <li>Keep your password safe. You are responsible for activity on your account.</li>
              <li>Tell us straight away if you think someone else has used your account.</li>
              <li>One person or business per account. Don&apos;t create accounts to get around a suspension.</li>
            </ul>
          ),
        },
        {
          id: "fees",
          title: "Fees",
          body: <p>Browsing, messaging and posting a car are free, and we take no commission on sales. If we introduce optional paid features, such as promoted listings for dealers, we will show the price clearly before you pay and these terms will be updated.</p>,
        },
        {
          id: "listings",
          title: "Listing a car",
          body: (
            <ul>
              <li>Listings must be truthful: real photos of the actual car, the correct year, honest mileage and a fair description of its condition.</li>
              <li>You must own the car or have the owner&apos;s written permission to sell it.</li>
              <li>The asking price must be the real price in taka. Don&apos;t list a lower price to attract calls.</li>
              <li>Papers uploaded for verification must be genuine. Forged papers mean permanent removal and may be reported to the authorities.</li>
              <li>Mark your car as sold once it&apos;s sold, and remove listings for cars that are no longer available.</li>
              <li>We may review, edit for formatting, hold back or remove any listing that breaks these rules.</li>
            </ul>
          ),
        },
        {
          id: "prohibited",
          title: "Listings we don't allow",
          body: (
            <ul>
              <li>Stolen vehicles, or cars with tampered chassis or engine numbers.</li>
              <li>Cars that can&apos;t legally be sold or registered in Bangladesh.</li>
              <li>Duplicate listings of the same car, or ads for things other than vehicles.</li>
              <li>Photos taken from other websites or that show a different car.</li>
            </ul>
          ),
        },
        {
          id: "verification",
          title: "Paper Verified badge",
          body: <p>The Paper Verified badge means our team has reviewed copies of the papers the seller uploaded and found them consistent with the listing. It is not a guarantee of the car&apos;s condition, mileage or history, and it is not a mechanical inspection. Always see the original papers and inspect the car before you pay.</p>,
        },
        {
          id: "transactions",
          title: "Buying and selling",
          body: <p>CarHat connects buyers and sellers; we are not a party to any sale. Price, payment, inspection, handover and the BRTA ownership transfer are agreed between buyer and seller, who are responsible for following the law. Never send an advance payment for a car you haven&apos;t seen.</p>,
        },
        {
          id: "dealers",
          title: "Dealer accounts",
          body: <p>Dealers must give accurate business details and keep their showroom stock up to date. Reconditioned cars must be described as reconditioned, with their import year and auction grade where known. We may remove the dealer badge from accounts that repeatedly break these terms.</p>,
        },
        {
          id: "content",
          title: "Your content",
          body: <p>You keep ownership of the photos and text you upload. By posting them you give CarHat a non-exclusive, royalty-free licence to display, resize, compress and share them on CarHat and in our marketing of your listing, for as long as the listing is on the site. Don&apos;t upload anything you don&apos;t have the right to share.</p>,
        },
        {
          id: "conduct",
          title: "Things you must not do",
          body: (
            <ul>
              <li>Use CarHat for fraud or anything illegal.</li>
              <li>Ask for advance payments for a car the buyer hasn&apos;t seen.</li>
              <li>Harass, threaten or spam other users, or contact them for anything other than the car.</li>
              <li>Copy or scrape listings, or try to get around the site&apos;s security.</li>
            </ul>
          ),
        },
        {
          id: "suspension",
          title: "Suspending accounts",
          body: <p>We may suspend or close an account, or remove listings, if we reasonably believe these terms have been broken or a user is at risk. Where we can, we&apos;ll tell you why.</p>,
        },
        {
          id: "liability",
          title: "Limitation of liability",
          body: <p>We work to keep listings accurate but can&apos;t guarantee them. To the extent the law allows, CarHat is not liable for indirect or consequential losses arising from use of the site or from a transaction between users. Nothing in these terms limits rights you have under the Consumer Rights Protection Act or other laws of Bangladesh.</p>,
        },
        {
          id: "law",
          title: "Governing law",
          body: <p>These terms are governed by the laws of Bangladesh, and the courts of Dhaka have jurisdiction over any dispute about them.</p>,
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: <p>We may update these terms. The date at the top shows the latest version; continuing to use CarHat after a change means you accept it.</p>,
        },
        {
          id: "contact",
          title: "Contact",
          body: <p>Questions about these terms? <Link href="/contact">Contact our team</Link>.</p>,
        },
      ]}
    />
  );
}
