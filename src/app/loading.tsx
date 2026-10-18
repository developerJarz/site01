import { PageLoader } from "@/components/ui/brand-loader";

/**
 * Route-level loading screen. Prerendered and prefetched with every route, so it appears the
 * instant a link is tapped; pure CSS, no client JavaScript. The header stays interactive above it.
 */
export default function Loading() {
  return <PageLoader label="Loading" />;
}
