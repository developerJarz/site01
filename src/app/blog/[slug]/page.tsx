import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Eye } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/lib/models/Blog";
import { BlogCard, type BlogSummary } from "@/components/blog/BlogCard";
import { CarImage } from "@/components/CarImage";
import { ShareButton } from "@/components/car/ShareButton";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, CONTAINER } from "@/components/ui/page";
import { cn, escapeRegex } from "@/lib/utils";
import { absoluteUrl, buildMetadata, splitKeywords } from "@/lib/seo";
import { shareImageUrl, truncate } from "@/lib/seo-text";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

const getPost = cache(async (slug: string) => {
  const decoded = decodeURIComponent(slug || "");
  await connectToDatabase();
  return (await Blog.findOne({
    $or: [{ slug: decoded }, { slug }, { slug: { $regex: new RegExp(`^${escapeRegex(decoded)}$`, "i") } }],
    published: true,
  }).lean()) as any;
});

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const post = await getPost(slug);
    if (post) {
      const cover = shareImageUrl(post.coverImage?.startsWith("data:") ? undefined : post.coverImage);
      return buildMetadata(`/blog/${post.slug}`, {
        title: post.seoTitle || post.title,
        useTemplate: !post.seoTitle,
        socialTitle: post.title,
        description: truncate(post.seoDescription || post.excerpt || "", 160),
        keywords: splitKeywords(post.keywords).length ? splitKeywords(post.keywords) : post.tags,
        images: cover ? [{ url: cover, alt: post.coverAlt || post.title }] : undefined,
        type: "article",
        publishedTime: new Date(post.createdAt).toISOString(),
        modifiedTime: new Date(post.updatedAt || post.createdAt).toISOString(),
      });
    }
  } catch {}
  return { title: "Blog", robots: { index: false } };
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  let post: any = null;
  let related: BlogSummary[] = [];
  try {
    post = await getPost(slug);
    if (post) {
      Blog.updateOne({ _id: post._id }, { $inc: { views: 1 } }).exec().catch(() => {});
      const sameTags = post.tags?.length ? { tags: { $in: post.tags } } : {};
      related = JSON.parse(JSON.stringify(await Blog.find({ published: true, _id: { $ne: post._id }, ...sameTags })
        .sort({ createdAt: -1 }).limit(3).select("title slug coverImage excerpt createdAt tags").lean()));
    }
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
  }
  if (!post) notFound();

  const published = new Date(post.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const paragraphs: string[] = String(post.content || "").split("\n").map((p) => p.trim()).filter(Boolean);
  const coverAlt = post.coverAlt || post.title;
  const postUrl = absoluteUrl(`/blog/${post.slug}`);
  const jsonLd = [{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: postUrl,
    url: postUrl,
    inLanguage: "en-BD",
    ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
    publisher: { "@type": "Organization", name: "CarHat BD", logo: { "@type": "ImageObject", url: absoluteUrl("/car-hat-bd.png") } },
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage && !post.coverImage.startsWith("data:") ? [absoluteUrl(shareImageUrl(post.coverImage)!)] : undefined,
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt || post.createdAt).toISOString(),
    author: { "@type": "Organization", name: post.author || "CarHat Team" },
  }, breadcrumbLd([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Blog", url: absoluteUrl("/blog") },
    { name: post.title, url: postUrl },
  ])];

  return (
    <article className="bg-white">
      <JsonLd data={jsonLd} />
      <header className="hero-backdrop border-b border-hairline">
        <div className={cn(CONTAINER, "max-w-4xl py-10 md:py-14")}>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />
          {!!post.tags?.length && (
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {post.tags.map((t: string) => (
                <li key={t}><Link href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-electric-deep shadow-soft hover:text-electric">{t}</Link></li>
              ))}
            </ul>
          )}
          <h1 className="mt-4 text-[2.1rem] font-extrabold leading-[1.1] text-night md:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-text">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-electric to-electric-light font-bold text-white" aria-hidden>
                {(post.author || "C")[0].toUpperCase()}
              </span>
              <div className="text-sm">
                <p className="font-bold text-night">{post.author || "CarHat Team"}</p>
                <p className="flex items-center gap-3 text-slate-text">
                  <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden /> {published}</span>
                  <span className="inline-flex items-center gap-1 tabular"><Eye size={13} aria-hidden /> {((post.views || 0) + 1).toLocaleString("en-IN")}</span>
                </p>
              </div>
            </div>
            <ShareButton title={post.title} />
          </div>
        </div>
      </header>

      {post.coverImage && (
        <div className={cn(CONTAINER, "max-w-5xl")}>
          <div className="relative -mt-px aspect-[16/8] overflow-hidden rounded-b-[32px] bg-mist md:mt-8 md:rounded-[32px]">
            <CarImage src={post.coverImage} alt={coverAlt} sizes="(min-width: 1024px) 1024px, 100vw" priority />
          </div>
        </div>
      )}

      <div className={cn(CONTAINER, "max-w-3xl py-12 md:py-16")}>
        <div className="prose-car">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="mt-12 flex flex-col items-start gap-4 rounded-3xl border border-hairline bg-gradient-to-br from-mist via-white to-haze p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-extrabold">Ready to find your car?</p>
            <p className="text-slate-text">Thousands of checked listings from dealers and owners.</p>
          </div>
          <Button asChild size="lg"><Link href="/cars">Browse cars <ArrowRight size={17} aria-hidden /></Link></Button>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-hairline bg-mist py-14">
          <div className={CONTAINER}>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 id="related-heading" className="text-[1.75rem] font-extrabold">Keep reading</h2>
              <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-electric hover:underline"><ArrowLeft size={15} aria-hidden /> All posts</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((r) => <BlogCard key={r._id} post={r} />)}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
