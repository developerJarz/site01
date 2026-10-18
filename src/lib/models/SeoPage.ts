import mongoose, { Schema, Model } from "mongoose";

/**
 * Admin overrides for one public page's search and social tags, keyed by path ("/", "/about", …).
 * Empty fields fall back to the defaults in lib/seo.ts, so only what the admin changed is stored.
 */
export interface ISeoPage {
  path: string;
  /** The <title> shown in Google results and the browser tab. */
  seoTitle?: string;
  /** Title used when the page is shared on Facebook, WhatsApp, X (og:title / twitter:title). */
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  updatedAt: Date;
}

const SeoPageSchema = new Schema<ISeoPage>(
  {
    path: { type: String, required: true, unique: true, trim: true },
    seoTitle: { type: String, trim: true, maxlength: 120 },
    metaTitle: { type: String, trim: true, maxlength: 120 },
    metaDescription: { type: String, trim: true, maxlength: 320 },
    keywords: { type: String, trim: true, maxlength: 500 },
    ogImage: { type: String, trim: true },
    ogImageAlt: { type: String, trim: true, maxlength: 200 },
    noindex: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SeoPage: Model<ISeoPage> =
  mongoose.models.SeoPage || mongoose.model<ISeoPage>("SeoPage", SeoPageSchema);
