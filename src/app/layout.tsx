import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-grow pt-16 relative">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
