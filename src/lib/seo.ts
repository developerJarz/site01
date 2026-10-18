import "server-only";
import type { Metadata } from "next";
import { connectToDatabase } from "./db";
import { SeoPage, type ISeoPage } from "./models/SeoPage";
import { SiteSettings } from "./models/SiteSettings";
import { CORE_KEYWORDS, PAGE_SEO_BY_PATH, SITE_NAME, type PageSeoDefaults } from "./seo-pages";
import { shareImageUrl } from "./seo-text";

/** Absolute origin for canonical links, the sitemap and structured data. Set APP_BASE_URL to the live domain. */
export const SITE_URL = (process.env.APP_BASE_URL || process.env.URL || "http://localhost:3000").replace(/\/+$/, "");
export const DEFAULT_OG_IMAGE = "/og-default.jpg";

export const absoluteUrl = (path = "/") => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

export interface SeoGlobals {
  siteName: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  ogImage: string;
  contactEmail?: string;
  supportPhone?: string;
  address?: string;
  logoUrl?: string;
  socialLinks?: Record<string, string>;
}

type SeoData = { pages: Map<string, ISeoPage>; globals: SeoGlobals };

const FALLBACK_GLOBALS: SeoGlobals = {
  siteName: SITE_NAME,
  titleTemplate: `%s | ${SITE_NAME}`,
  description: PAGE_SEO_BY_PATH.get("/")!.description,
  keywords: CORE_KEYWORDS,
  ogImage: DEFAULT_OG_IMAGE,
};

// Admin edits are rare and every page reads these, so keep them in memory briefly.
const TTL_MS = 60_000;
let cache: { at: number; data: Promise<SeoData> } | undefined;

export const splitKeywords = (s?: string) => (s || "").split(/[,\n]/).map((k) => k.trim()).filter(Boolean);

async function fetchSeoData(): Promise<SeoData> {
  try {
    await connectToDatabase();
    const [pages, settings] = await Promise.all([
      SeoPage.find().lean(),
      SiteSettings.findOne()
        .select("siteName metaTitleTemplate metaDescription seoKeywords defaultOgImage contactEmail supportPhone address logoUrl socialLinks")
        .lean(),
    ]);
    const template = settings?.metaTitleTemplate?.includes("%s") ? settings.metaTitleTemplate : FALLBACK_GLOBALS.titleTemplate;
    return {
      pages: new Map(pages.map((p) => [p.path, p])),
      globals: {
        siteName: settings?.siteName?.trim() || SITE_NAME,
        titleTemplate: template,
        description: settings?.metaDescription?.trim() || FALLBACK_GLOBALS.description,
        keywords: splitKeywords(settings?.seoKeywords).length ? splitKeywords(settings?.seoKeywords) : CORE_KEYWORDS,
        ogImage: settings?.defaultOgImage?.trim() || DEFAULT_OG_IMAGE,
        contactEmail: settings?.contactEmail,
        supportPhone: settings?.supportPhone,
        address: settings?.address,
        logoUrl: settings?.logoUrl,
        socialLinks: settings?.socialLinks as unknown as Record<string, string> | undefined,
      },
    };
  } catch (error) {
    console.error("SEO settings failed to load; using defaults.", error);
    return { pages: new Map(), globals: FALLBACK_GLOBALS };
  }
}

export function loadSeoData(): Promise<SeoData> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const data = fetchSeoData();
    cache = { at: Date.now(), data };
  }
  return cache.data;
}

/** Called after an admin saves SEO so this server instance picks it up straight away. */
export function invalidateSeoCache() {
  cache = undefined;
}

export interface MetadataInput extends Partial<Omit<PageSeoDefaults, "path" | "name">> {
  /** Social title when it should differ from the search title. */
  socialTitle?: string;
  images?: { url: string; alt?: string; width?: number; height?: number }[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Apply the site title template ("%s | CarHat BD") instead of using the title as-is. */
  useTemplate?: boolean;
}

/**
 * Metadata for one page: admin override → page-specific value → registry default → site default.
 * `path` is the canonical path and the key admins edit in Admin → SEO & content.
 */
export async function buildMetadata(path: string, input: MetadataInput = {}): Promise<Metadata> {
  const { pages, globals } = await loadSeoData();
  const base = PAGE_SEO_BY_PATH.get(path);
  const o = pages.get(path);

  const customTitle = o?.seoTitle?.trim();
  const rawTitle = customTitle || input.title || base?.title || globals.siteName;
  const title = !customTitle && input.useTemplate ? globals.titleTemplate.replace("%s", rawTitle) : rawTitle;
  const description = o?.metaDescription?.trim() || input.description || base?.description || globals.description;
  const socialTitle = o?.metaTitle?.trim() || input.socialTitle || title;
  const pageKeywords = splitKeywords(o?.keywords).length ? splitKeywords(o?.keywords) : input.keywords || base?.keywords || [];
  const keywords = [...new Set([...pageKeywords, ...globals.keywords])].slice(0, 15);
  const images = o?.ogImage
    ? [{ url: shareImageUrl(o.ogImage)!, alt: o.ogImageAlt || socialTitle }]
    : input.images?.length
      ? input.images
      : [{ url: shareImageUrl(globals.ogImage)!, alt: o?.ogImageAlt || `${globals.siteName} – buy and sell cars in Bangladesh`, width: 1200, height: 630 }];
  const noindex = o?.noindex ?? input.noindex ?? base?.noindex ?? false;

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: input.type || "website",
      url: path,
      siteName: globals.siteName,
      locale: "en_BD",
      title: socialTitle,
      description,
      images,
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: images.map((i) => i.url) },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  };
}
