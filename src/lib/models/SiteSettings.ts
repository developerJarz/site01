import mongoose, { Schema, Model } from "mongoose";

export interface ISiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  supportPhone: string;
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
    supportPhone: { type: String, default: "+880 1234-567890" },
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
      default: "Buy, sell, and explore the best cars in Bangladesh on CarHat.bd. Find your perfect car with verified dealers and private sellers.",
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
