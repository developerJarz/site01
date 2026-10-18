import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { MaintenanceGate } from "@/components/layout/MaintenanceGate";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { Suspense } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, absoluteUrl, loadSeoData } from "@/lib/seo";
import { PAGE_SEO_BY_PATH } from "@/lib/seo-pages";
import { shareImageUrl } from "@/lib/seo-text";
import { getSiteSettings } from "@/lib/site-settings";
import { brandPalette } from "@/lib/site-config";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

/** Site-wide defaults from Admin → SEO & content. Each page refines these with buildMetadata(). */
export async function generateMetadata(): Promise<Metadata> {
  const [{ globals }, { appearance }] = await Promise.all([loadSeoData(), getSiteSettings()]);
  const home = PAGE_SEO_BY_PATH.get("/")!;
  // The default icons are the logo's top-down car on its blue gradient (public/favicon.ico, icon.png,
  // apple-touch-icon.png). Admin → Website builder → Brand can replace them with an uploaded favicon.
  const custom = appearance.faviconUrl;
  const icons: Metadata["icons"] = custom
    ? { icon: custom, shortcut: custom, apple: custom }
    : {
        icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48" }, { url: "/icon.png", type: "image/png", sizes: "512x512" }],
        shortcut: "/favicon.ico",
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
      };
  return {
    metadataBase: new URL(SITE_URL),
    icons,
    applicationName: globals.siteName,
    title: { default: home.title, template: globals.titleTemplate },
    description: globals.description,
    keywords: globals.keywords,
    category: "automotive",
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      locale: "en_BD",
      siteName: globals.siteName,
      title: home.title,
      description: globals.description,
      images: [{ url: shareImageUrl(globals.ogImage)!, width: 1200, height: 630, alt: `${globals.siteName} – buy and sell cars in Bangladesh` }],
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    verification: { google: "Ie3LhIXLbhvoCIeSpgjp9Mg2i2e7J6dTBySQ3hjLNGE" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ globals }, { appearance }] = await Promise.all([loadSeoData(), getSiteSettings()]);
  // The admin's brand colour replaces the theme's blue tokens (see lib/site-config brandPalette).
  // html:root outranks the stylesheet's :root, whatever order the two load in.
  const palette = brandPalette(appearance.brandColor);
  const themeCss = palette ? `html:root{${Object.entries(palette).map(([k, v]) => `${k}:${v}`).join(";")}}` : "";
  const sameAs = Object.entries(globals.socialLinks || {})
    .filter(([k, v]) => k !== "whatsapp" && /^https?:\/\/[^/]+\/.+/.test(v || ""))
    .map(([, v]) => v);
  const siteLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: globals.siteName,
      url: SITE_URL,
      logo: absoluteUrl(globals.logoUrl || "/car-hat-bd.png"),
      description: globals.description,
      areaServed: { "@type": "Country", name: "Bangladesh" },
      ...(globals.contactEmail || globals.supportPhone ? {
        contactPoint: [{
          "@type": "ContactPoint",
          contactType: "customer support",
          areaServed: "BD",
          availableLanguage: ["English", "Bengali"],
          ...(globals.supportPhone ? { telephone: globals.supportPhone } : {}),
          ...(globals.contactEmail ? { email: globals.contactEmail } : {}),
        }],
      } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: globals.siteName,
      url: SITE_URL,
      inLanguage: "en-BD",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/cars?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang="en-BD" className={jakarta.variable}>
      <head>
        {themeCss && <style id="brand-theme">{themeCss}</style>}
        <JsonLd data={siteLd} />
      </head>

      {/* Google Analytics (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-MBRKH7BM1B"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-MBRKH7BM1B');
        `}
      </Script>

      {/* Google Tag Manager */}
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NRPMKS26');
        `}
      </Script>

      <body suppressHydrationWarning className="min-h-screen flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NRPMKS26"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:shadow-float"
        >
          Skip to content
        </a>
        <Providers>
          <Suspense fallback={null}><RouteProgress /></Suspense>
          <Navbar />
          {/* Reserve space for the floating one-line header. */}
          <main id="main" className="relative grow pt-16 md:pt-[84px]">
            <AnnouncementBar />
            <MaintenanceGate>{children}</MaintenanceGate>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
