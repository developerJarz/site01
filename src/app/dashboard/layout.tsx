import type { Metadata } from "next";

// Account pages: useful to signed-in users only, so kept out of search results.
export const metadata: Metadata = { title: "My dashboard", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
