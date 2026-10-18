import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/register");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
