import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/ui/legal";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/privacy");

// Static page: rebuilt hourly, or immediately when its SEO is edited in the admin.
export const revalidate = 3600;

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      updated="October 2026"
      intro={<p>This policy explains what information CarHat BD collects when you buy, sell or browse cars, how we use and protect it, and the choices you have.</p>}
      sections={[
        {
          id: "collect",
          title: "Information we collect",
          body: (
            <ul>
              <li>Account details you give us: name, email, phone and WhatsApp number, city and, for dealers, your showroom details.</li>
              <li>Listing details: make, model, year, photos, description and price.</li>
              <li>Car papers you upload for verification. These are seen only by the CarHat team and are never shown on your listing.</li>
              <li>Messages you send to other users and to our support team.</li>
              <li>Usage data such as pages visited, searches, approximate location from your IP address, and device and browser information.</li>
            </ul>
          ),
        },
        {
          id: "use",
          title: "How we use your information",
          body: (
            <ul>
              <li>To run the marketplace: publish your listings and connect buyers with sellers.</li>
              <li>To check car papers and award the Paper Verified badge.</li>
              <li>To send account emails such as sign-up codes and password resets, and, if you subscribe, our newsletter.</li>
              <li>To detect and prevent fraud, spam and abuse.</li>
              <li>To understand how the site is used, measure which pages help people most, and make CarHat better.</li>
            </ul>
          ),
        },
        {
          id: "visible",
          title: "What other people can see",
          body: (
            <p>
              Your name (or showroom name), your listings and your city are public. Your phone number and WhatsApp button appear on your listings only if
              you turn them on in your profile. Your email address is never shown to other users. Public listings can be found through search engines such as Google.
            </p>
          ),
        },
        {
          id: "photos",
          title: "Photos and papers",
          body: (
            <p>
              When you upload photos we remove location and camera (EXIF) data, rotate them correctly and compress them before storing them with our
              image host, Cloudinary. Car papers are stored as private files that can only be opened through signed links given to our admin team.
            </p>
          ),
        },
        {
          id: "security",
          title: "Storage and security",
          body: (
            <p>
              Your data is stored in a managed MongoDB database. All traffic is encrypted with HTTPS and passwords are stored only as salted hashes.
              Sign-in sessions are protected tokens that expire automatically. No system is perfectly secure, but we limit who on our team can access personal data.
            </p>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and analytics",
          body: <p>We use essential cookies to keep you signed in and remember your preferences, and analytics cookies (Google Analytics and Google Tag Manager) to understand how the site is used. You can block or delete cookies in your browser settings; the site still works, but you will need to sign in again.</p>,
        },
        {
          id: "sharing",
          title: "Sharing",
          body: (
            <p>
              We do not sell your personal data. We share it only with service providers that help us run CarHat, such as website hosting, our database
              provider, Cloudinary for images, email delivery and Google Analytics, and only for that purpose, or where the law requires it.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <ul>
              <li>See and update your details at any time from your profile.</li>
              <li>Delete any of your listings from your dashboard.</li>
              <li>Ask us to delete your account and the data linked to it.</li>
              <li>Unsubscribe from our newsletter with the link in any email.</li>
            </ul>
          ),
        },
        {
          id: "retention",
          title: "How long we keep data",
          body: <p>We keep your data while your account is active. If you ask us to delete your account, we remove your personal data and photos within 30 days, except where the law requires us to keep it.</p>,
        },
        {
          id: "children",
          title: "Children",
          body: <p>CarHat is not meant for children under 18, and we don&apos;t knowingly collect their personal data.</p>,
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: <p>We may update this policy. The date at the top shows the latest version, and we&apos;ll email registered users about significant changes.</p>,
        },
        {
          id: "contact",
          title: "Contact",
          body: <p>Questions or requests about your data? <Link href="/contact">Contact our team</Link>.</p>,
        },
      ]}
    />
  );
}
