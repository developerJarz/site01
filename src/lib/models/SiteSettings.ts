import mongoose, { Schema, Model } from "mongoose";
import type { AppearanceSettings, WatermarkSettings } from "../site-config";

/** A customer quote shown in the homepage reviews carousel, managed in Admin → SEO & content. */
export interface ITestimonial {
  _id?: string;
  name: string;
  role: string;
  location?: string;
  rating: number;
  content: string;
  published: boolean;
}

export interface ISiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
  workingHours: string;
  logoUrl: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    linkedin: string;
    whatsapp: string;
  };
  googleMapsUrl: string;
  copyrightText: string;
  defaultListingStatus: "active" | "pending";
  autoApproveListings: boolean;
  maxImagesPerListing: number;
  metaTitleTemplate: string;
  metaDescription: string;
  seoKeywords: string;
  defaultOgImage: string;
  testimonials: ITestimonial[];
  maintenanceMode: boolean;
  maintenanceMessage: string;
  /** Website builder: header, footer, homepage, brand colour and favicon (Admin → Appearance). */
  appearance?: Partial<AppearanceSettings>;
  /** How listing photos are watermarked on upload (Admin → Settings). */
  watermark?: Partial<WatermarkSettings>;
  updatedAt: Date;
}

const SiteSettingsSchema: Schema<ISiteSettings> = new Schema(
  {
    siteName: { type: String, default: "CarHat.bd" },
    tagline: {
      type: String,
      default: "The premier destination to buy, sell, and explore the best cars in Bangladesh.",
    },
    contactEmail: { type: String, default: "carhatbd@gmail.com" },
    supportPhone: { type: String, default: "+880 1700-000000" },
    address: {
      type: String,
      default: "Plot 12, Road 11, Block C, Gulshan-2, Dhaka 1212, Bangladesh",
    },
    workingHours: {
      type: String,
      default: "Sat - Thu: 9:00 AM - 8:00 PM (Friday Closed)",
    },
    logoUrl: { type: String, default: "/car-hat-bd.png" },
    socialLinks: {
      facebook: { type: String, default: "https://facebook.com" },
      twitter: { type: String, default: "https://twitter.com" },
      instagram: { type: String, default: "https://instagram.com" },
      youtube: { type: String, default: "https://youtube.com" },
      linkedin: { type: String, default: "https://linkedin.com" },
      whatsapp: { type: String, default: "+8801700000000" },
    },
    googleMapsUrl: {
      type: String,
      default: "https://maps.google.com/?q=Gulshan-2,Dhaka,Bangladesh",
    },
    copyrightText: {
      type: String,
      default: "CarHat.bd. All rights reserved.",
    },
    defaultListingStatus: {
      type: String,
      enum: ["active", "pending"],
      default: "pending",
    },
    autoApproveListings: { type: Boolean, default: false },
    maxImagesPerListing: { type: Number, default: 10 },
    metaTitleTemplate: {
      type: String,
      default: "%s | CarHat BD",
    },
    metaDescription: {
      type: String,
      default:
        "Buy, sell, and explore the best cars in Bangladesh on CarHat.bd. Find your perfect car with verified dealers and private sellers.",
    },
    seoKeywords: { type: String, default: "" },
    defaultOgImage: { type: String, default: "" },
    testimonials: [
      {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        role: { type: String, trim: true, maxlength: 120, default: "" },
        location: { type: String, trim: true, maxlength: 80, default: "" },
        rating: { type: Number, min: 1, max: 5, default: 5 },
        content: { type: String, required: true, trim: true, maxlength: 600 },
        published: { type: Boolean, default: true },
      },
    ],
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: "We're currently performing maintenance. Please check back soon!",
    },
    // Shapes are validated by lib/site-config before saving; missing keys fall back to its defaults.
    appearance: { type: Schema.Types.Mixed, default: undefined },
    watermark: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
