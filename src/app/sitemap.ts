import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import { Listing } from "@/lib/models/Listing";
import { Blog } from "@/lib/models/Blog";
import { absoluteUrl, loadSeoData } from "@/lib/seo";
import { BRAND_PAGES, PAGE_SEO, brandSlug } from "@/lib/seo-pages";
import { listingImageUrl } from "@/lib/utils";

// Rebuilt at most every 30 minutes so new cars reach Google quickly without querying on every crawl.
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { pages } = await loadSeoData();
  const indexable = (path: string, fallbackNoindex?: boolean) => !(pages.get(path)?.noindex ?? fallbackNoindex);

  const entries: MetadataRoute.Sitemap = PAGE_SEO.filter((p) => indexable(p.path, p.noindex)).map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    await connectToDatabase();
    const [cars, posts, makes] = await Promise.all([
      Listing.find({ status: "active" }).select({ slug: 1, updatedAt: 1, images: { $slice: 3 } }).sort({ updatedAt: -1 }).limit(45_000).lean(),
      Blog.find({ published: true }).select("slug updatedAt coverImage").lean(),
      Listing.distinct("make", { status: "active" }),
    ]);

    // Brand price pages: the showcased makes plus any make that has cars live.
    const brands = new Map<string, string>();
    for (const make of [...BRAND_PAGES, ...(makes as string[])]) {
      const slug = brandSlug(String(make || ""));
      if (slug && !brands.has(slug)) brands.set(slug, String(make));
    }
    for (const slug of brands.keys()) {
      const path = `/brands/${slug}`;
      if (indexable(path)) entries.push({ url: absoluteUrl(path), lastModified: now, changeFrequency: "daily", priority: 0.8 });
    }

    for (const car of cars) {
      if (!car.slug) continue;
      const images = (car.images || [])
        .map((src, i) => listingImageUrl(car._id, src, i))
        .filter((u): u is string => !!u)
        .map((u) => absoluteUrl(u));
      entries.push({
        url: absoluteUrl(`/cars/${encodeURIComponent(car.slug)}`),
        lastModified: car.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.7,
        ...(images.length ? { images } : {}),
      });
    }

    for (const post of posts) {
      entries.push({
        url: absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
        lastModified: post.updatedAt || now,
        changeFrequency: "monthly",
        priority: 0.6,
        ...(post.coverImage && !post.coverImage.startsWith("data:") ? { images: [absoluteUrl(post.coverImage)] } : {}),
      });
    }
  } catch (error) {
    console.error("Sitemap: listings and posts failed to load.", error);
  }

  return entries;
}
