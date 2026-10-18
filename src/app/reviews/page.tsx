import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/lib/models/Blog";
import { BlogCard, type BlogSummary } from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { CONTAINER, EmptyState, PageHero } from "@/components/ui/page";
import { cn } from "@/lib/utils";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/reviews");

export const revalidate = 300;

/** Blog posts tagged "review" (any case) appear here; the team manages them in Admin → Blog. */
const REVIEW_TAG = /^(car[\s-]?)?reviews?$/i;

export default async function ReviewsPage() {
  let reviews: BlogSummary[] = [];
  let guides: BlogSummary[] = [];
  try {
    await connectToDatabase();
    const fields = "title slug excerpt coverImage tags views createdAt";
    const [r, g] = await Promise.all([
      Blog.find({ published: true, tags: REVIEW_TAG }).select(fields).sort({ createdAt: -1 }).limit(30).lean(),
      Blog.find({ published: true, tags: { $not: REVIEW_TAG } }).select(fields).sort({ views: -1 }).limit(3).lean(),
    ]);
    reviews = JSON.parse(JSON.stringify(r));
    guides = JSON.parse(JSON.stringify(g));
  } catch (error) {
    console.error("Reviews failed to load:", error);
  }
  const [first, ...rest] = reviews;

  return (
    <>
      <PageHero
        eyebrow="Car reviews"
        title={<>Honest reviews of <span className="text-gradient-electric">real cars</span></>}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Car reviews" }]}
        description="What it's like to own the cars people buy in Bangladesh: running costs, common faults, and what to check before you pay."
        actions={<Button asChild variant="secondary"><Link href="/cars">Browse cars</Link></Button>}
      />

      <div className={cn(CONTAINER, "py-12 md:py-16")}>
        {first ? (
          <div className="space-y-8">
            <BlogCard post={first} featured />
            {rest.length > 0 && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <BlogCard key={p._id} post={p} />)}</div>}
          </div>
        ) : (
          <EmptyState icon={Newspaper} title="Our first reviews are on the way"
            body="We're driving the most popular models now. Meanwhile, our buying guides cover what to check on any used car."
            action={<Button asChild><Link href="/blog">Read the buying guides <ArrowRight size={16} aria-hidden /></Link></Button>} />
        )}

        {!first && guides.length > 0 && (
          <section aria-labelledby="guides-heading" className="mt-14">
            <h2 id="guides-heading" className="mb-6 text-2xl font-extrabold">Popular guides</h2>
            <div className="grid gap-6 md:grid-cols-3">{guides.map((p) => <BlogCard key={p._id} post={p} />)}</div>
          </section>
        )}
      </div>
    </>
  );
}
