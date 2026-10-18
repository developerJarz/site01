import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/lib/models/Blog";
import { BlogCard, type BlogSummary } from "@/components/blog/BlogCard";
import { CONTAINER, EmptyState, PageHero } from "@/components/ui/page";
import { cn } from "@/lib/utils";

export const generateMetadata = (): Promise<Metadata> => buildMetadata("/blog");

// Rebuilt at most once a minute.
export const revalidate = 60;

export default async function BlogArchivePage(props: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await props.searchParams;
  const activeTag = typeof tag === "string" ? tag.slice(0, 40) : "";
  let posts: BlogSummary[] = [];
  let tags: string[] = [];
  try {
    await connectToDatabase();
    const [docs, allTags] = await Promise.all([
      Blog.find({ published: true, ...(activeTag ? { tags: activeTag } : {}) })
        .select("title slug excerpt coverImage tags views createdAt").sort({ createdAt: -1 }).limit(60).lean(),
      Blog.distinct("tags", { published: true }),
    ]);
    posts = JSON.parse(JSON.stringify(docs));
    tags = (allTags as string[]).filter(Boolean).slice(0, 12);
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
  }

  const [first, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="CarHat blog"
        title={<>Guides for <span className="text-gradient-electric">smarter</span> car buying</>}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog" }]}
        description="Buying guides, selling tips, reviews and market news for Bangladesh."
      >
        {tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Topics">
            <li><TagLink href="/blog" active={!activeTag}>All posts</TagLink></li>
            {tags.map((t) => <li key={t}><TagLink href={`/blog?tag=${encodeURIComponent(t)}`} active={activeTag === t}>{t}</TagLink></li>)}
          </ul>
        )}
      </PageHero>

      <div className={cn(CONTAINER, "py-12 md:py-16")}>
        {!first ? (
          <EmptyState icon={BookOpen} title={activeTag ? `No posts tagged “${activeTag}” yet` : "No posts yet"}
            body="Check back soon for buying guides and car news." />
        ) : (
          <div className="space-y-8">
            <BlogCard post={first} featured />
            {rest.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => <BlogCard key={p._id} post={p} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function TagLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={cn("inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold capitalize transition-colors",
        active ? "border-night bg-night text-white" : "border-hairline bg-white text-slate-text hover:border-electric/40 hover:text-night")}>
      {children}
    </Link>
  );
}
