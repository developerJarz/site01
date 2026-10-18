import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/lib/models/SiteSettings";
import { Review } from "@/lib/models/Review";
import { TESTIMONIALS } from "./data";
import { SectionHeading } from "./SectionHeading";
import { ReviewsCarousel, type ReviewItem } from "./ReviewsCarousel";

/**
 * Testimonials the team adds in Admin → SEO & content, followed by real buyer reviews of dealers.
 * The built-in examples only show until the first testimonial is added.
 */
async function loadReviews(): Promise<ReviewItem[]> {
  try {
    await connectToDatabase();
    const [settings, dealerReviews] = await Promise.all([
      SiteSettings.findOne().select("testimonials").lean(),
      Review.find({ rating: { $gte: 4 }, review: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .limit(9)
        .populate("user", "name city")
        .populate("dealer", "name dealershipName")
        .lean(),
    ]);
    const curated = (settings?.testimonials || [])
      .filter((t) => t.published !== false && t.name && t.content)
      .map((t, i) => ({ id: String(t._id || `t${i}`), name: t.name, role: t.role, location: t.location, rating: t.rating || 5, content: t.content }));
    const fromDealers = dealerReviews.flatMap((r) => {
      const user = r.user as unknown as { name?: string; city?: string } | null;
      const dealer = r.dealer as unknown as { name?: string; dealershipName?: string } | null;
      if (!user?.name) return [];
      return [{
        id: String(r._id),
        name: user.name,
        role: `Bought from ${dealer?.dealershipName || dealer?.name || "a CarHat dealer"}`,
        location: user.city,
        rating: r.rating,
        content: r.review.length > 280 ? `${r.review.slice(0, 277)}…` : r.review,
      }];
    });
    const items = [...curated, ...fromDealers];
    if (items.length) return items;
  } catch (error) {
    console.error("Reviews failed to load:", error);
  }
  return TESTIMONIALS.map((t, i) => ({ id: `default-${i}`, ...t }));
}

import type { HomeSectionConfig } from "@/lib/site-config";

export async function Reviews({ config }: { config?: HomeSectionConfig }) {
  const items = await loadReviews();
  const eyebrow = config?.eyebrow || "Customer reviews";
  const title = config?.title || "Buyers and sellers on CarHat BD";
  const action = config?.actionLabel && config?.actionHref ? { label: config.actionLabel, href: config.actionHref } : { href: "/reviews", label: "Read car reviews" };

  return (
    <section aria-labelledby="reviews-heading" className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <SectionHeading id="reviews-heading" eyebrow={eyebrow} title={title}
        description={config?.subtitle}
        action={action} />
      <ReviewsCarousel items={items} />
      <p className="mt-6 text-center text-sm text-slate-text md:hidden">
        <Link href={action.href} className="font-semibold text-electric">{action.label}</Link>
      </p>
    </section>
  );
}
