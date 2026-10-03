import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";

// One variable family; its width axis (wdth 62–125) does the expressive work.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#082f66",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "CarHat.bd — Modern Car Marketplace in Bangladesh",
    template: "%s | CarHat.bd",
  },
  description:
    "The premier destination to buy, sell, and explore the best cars in Bangladesh. Find new, used, and reconditioned vehicles from verified dealers and private sellers.",
  keywords: [
    "car marketplace Bangladesh",
    "buy car Dhaka",
    "sell car online BD",
    "used cars Bangladesh",
    "reconditioned cars",
    "CarHat",
  ],
  metadataBase: new URL(process.env.APP_BASE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CarHat.bd",
    title: "CarHat.bd — Modern Car Marketplace in Bangladesh",
    description:
      "Buy, sell, and explore the best cars in Bangladesh. Verified dealers, secure transactions.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={archivo.variable}>
      <head>
        <meta name="google-site-verification" content="Ie3LhIXLbhvoCIeSpgjp9Mg2i2e7J6dTBySQ3hjLNGE" />
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
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:font-semibold focus:shadow-lift"
        >
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main" className="flex-grow pt-16 relative">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
