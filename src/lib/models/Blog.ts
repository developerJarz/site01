import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  /** Optional search overrides; empty means the title and excerpt are used. */
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  coverAlt?: string;
  published: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema<IBlog> = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },
    author: { type: String, default: "CarHat Team" },
    tags: [{ type: String }],
    seoTitle: { type: String, trim: true, maxlength: 120 },
    seoDescription: { type: String, trim: true, maxlength: 320 },
    keywords: { type: String, trim: true, maxlength: 500 },
    coverAlt: { type: String, trim: true, maxlength: 200 },
    published: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);
