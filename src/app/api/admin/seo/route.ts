import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { SeoPage } from "@/lib/models/SeoPage";
import { SiteSettings } from "@/lib/models/SiteSettings";
import { Listing } from "@/lib/models/Listing";
import { Blog } from "@/lib/models/Blog";
import { invalidateSeoCache } from "@/lib/seo";
import { BRAND_PAGES, PAGE_SEO, PAGE_SEO_BY_PATH, brandSeoDefaults, brandSlug, type PageSeoDefaults } from "@/lib/seo-pages";

export const dynamic = "force-dynamic";

const PAGE_FIELDS = ["seoTitle", "metaTitle", "metaDescription", "keywords", "ogImage", "ogImageAlt"] as const;
const LIMITS: Record<string, number> = { seoTitle: 120, metaTitle: 120, metaDescription: 320, keywords: 500, ogImage: 1000, ogImageAlt: 200 };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isImageUrl = (v: string) => !v || /^https:\/\/\S+$/.test(v) || /^\/[\w\-./]+$/.test(v);

/** Every page an admin can tune: the fixed pages plus a price page per make. */
async function editablePages(): Promise<PageSeoDefaults[]> {
  let makes: string[] = [];
  try { makes = (await Listing.distinct("make", { status: "active" })) as string[]; } catch {}
  const brands = new Map<string, string>();
  for (const m of [...BRAND_PAGES, ...makes]) {
    const slug = brandSlug(String(m || ""));
    if (slug && !brands.has(slug)) brands.set(slug, String(m));
  }
  return [...PAGE_SEO, ...[...brands.values()].map((m) => brandSeoDefaults(m))];
}

/** Content problems search engines notice on car listings and blog posts. */
async function contentAudit() {
  const live = { status: "active" as const };
  const published = { published: true };
  const photoCount = { $size: { $ifNull: ["$images", []] } };
  const [
    liveListings, noPhotos, fewPhotos, shortDescription, missingAlts,
    posts, postsNoMeta, postsShortExcerpt, postsNoAlt, postsNoKeywords,
  ] = await Promise.all([
    Listing.countDocuments(live),
    Listing.countDocuments({ ...live, $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] }),
    Listing.countDocuments({ ...live, $expr: { $and: [{ $gt: [photoCount, 0] }, { $lt: [photoCount, 4] }] } }),
    Listing.countDocuments({ ...live, $expr: { $lt: [{ $strLenCP: { $ifNull: ["$description", ""] } }, 120] } }),
    Listing.countDocuments({ ...live, $or: [{ imageAlts: { $exists: false } }, { imageAlts: { $size: 0 } }] }),
    Blog.countDocuments(published),
    Blog.countDocuments({ ...published, $or: [{ seoDescription: { $exists: false } }, { seoDescription: "" }] }),
    Blog.countDocuments({ ...published, $expr: { $lt: [{ $strLenCP: { $ifNull: ["$excerpt", ""] } }, 70] } }),
    Blog.countDocuments({ ...published, $or: [{ coverAlt: { $exists: false } }, { coverAlt: "" }] }),
    Blog.countDocuments({ ...published, $or: [{ keywords: { $exists: false } }, { keywords: "" }] }),
  ]);
  return {
    listings: { live: liveListings, noPhotos, fewPhotos, shortDescription, missingAlts },
    blogs: { published: posts, noMeta: postsNoMeta, shortExcerpt: postsShortExcerpt, noAlt: postsNoAlt, noKeywords: postsNoKeywords },
  };
}

export async function GET(req: Request) {
  const auth = await requireAdmin("seo.manage");
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    if (new URL(req.url).searchParams.get("audit") === "1") return NextResponse.json(await contentAudit());
    const [pages, overrides, settings] = await Promise.all([
      editablePages(),
      SeoPage.find().lean(),
      SiteSettings.findOne().select("metaTitleTemplate metaDescription seoKeywords defaultOgImage testimonials").lean(),
    ]);
    const byPath = new Map(overrides.map((o) => [o.path, o]));
    return NextResponse.json({
      pages: pages.map((p) => ({ defaults: p, override: byPath.get(p.path) || null })),
      globals: {
        metaTitleTemplate: settings?.metaTitleTemplate || "%s | CarHat BD",
        metaDescription: settings?.metaDescription || "",
        seoKeywords: settings?.seoKeywords || "",
        defaultOgImage: settings?.defaultOgImage || "",
      },
      testimonials: JSON.parse(JSON.stringify(settings?.testimonials || [])),
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/** PUT { path, seoTitle, metaTitle, metaDescription, keywords, ogImage, ogImageAlt, noindex } — save one page. */
export async function PUT(req: Request) {
  const auth = await requireAdmin("seo.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const path = text(body.path, 200);
    await connectToDatabase();
    const allowed = PAGE_SEO_BY_PATH.has(path) || /^\/brands\/[a-z0-9-]+$/.test(path);
    if (!allowed) return NextResponse.json({ error: "This page can't be edited here." }, { status: 400 });

    const update: Record<string, string | boolean> = {};
    for (const f of PAGE_FIELDS) update[f] = text(body[f], LIMITS[f]);
    if (!isImageUrl(String(update.ogImage))) return NextResponse.json({ error: "Share image must be an https:// link or a site path like /og-default.jpg." }, { status: 400 });
    update.noindex = body.noindex === true;

    const empty = PAGE_FIELDS.every((f) => !update[f]) && !update.noindex;
    if (empty) await SeoPage.deleteOne({ path });
    else await SeoPage.updateOne({ path }, { $set: { path, ...update } }, { upsert: true });

    invalidateSeoCache();
    revalidatePath(path);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ success: true, override: empty ? null : { path, ...update } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/** PATCH { globals: {…} } or { testimonials: […] }. */
export async function PATCH(req: Request) {
  const auth = await requireAdmin("seo.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    await connectToDatabase();

    if (body.globals) {
      const g = body.globals;
      const template = text(g.metaTitleTemplate, 120);
      if (template && !template.includes("%s")) {
        return NextResponse.json({ error: "The title template must contain %s where the page title goes." }, { status: 400 });
      }
      const ogImage = text(g.defaultOgImage, 1000);
      if (!isImageUrl(ogImage)) return NextResponse.json({ error: "Default share image must be an https:// link or a site path." }, { status: 400 });
      await SiteSettings.findOneAndUpdate({}, {
        $set: {
          metaTitleTemplate: template || "%s | CarHat BD",
          metaDescription: text(g.metaDescription, 320),
          seoKeywords: text(g.seoKeywords, 1000),
          defaultOgImage: ogImage,
        },
      }, { upsert: true, setDefaultsOnInsert: true });
      invalidateSeoCache();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    if (Array.isArray(body.testimonials)) {
      const testimonials = body.testimonials.slice(0, 50).map((t: Record<string, unknown>) => ({
        name: text(t.name, 80),
        role: text(t.role, 120),
        location: text(t.location, 80),
        rating: Math.min(5, Math.max(1, Math.round(Number(t.rating) || 5))),
        content: text(t.content, 600),
        published: t.published !== false,
      }));
      if (testimonials.some((t: { name: string; content: string }) => !t.name || !t.content)) {
        return NextResponse.json({ error: "Every review needs a name and the review text." }, { status: 400 });
      }
      await SiteSettings.findOneAndUpdate({}, { $set: { testimonials } }, { upsert: true, setDefaultsOnInsert: true });
      revalidatePath("/");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
