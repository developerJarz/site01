import mongoose, { Schema, Model } from "mongoose";

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
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt: Date;
}

const SiteSettingsSchema: Schema<ISiteSettings> = new Schema(
  {
    siteName: { type: String, default: "CarHat.bd" },
    tagline: {
      type: String,
      default: "The premier destination to buy, sell, and explore the best cars in Bangladesh.",
    },
    contactEmail: { type: String, default: "support@carhat.bd" },
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
      default: "%s | CarHat.bd - Modern Car Marketplace",
    },
    metaDescription: {
      type: String,
      default:
        "Buy, sell, and explore the best cars in Bangladesh on CarHat.bd. Find your perfect car with verified dealers and private sellers.",
    },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      default: "We're currently performing maintenance. Please check back soon!",
    },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
