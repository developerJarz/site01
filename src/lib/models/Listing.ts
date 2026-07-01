import mongoose, { Schema, Model } from "mongoose";

export interface IListing {
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: "new" | "used" | "reconditioned";
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: "petrol" | "diesel" | "cng" | "hybrid" | "electric" | "octane";
  transmission: "manual" | "automatic" | "semi-automatic";
  engineSize: number;
  color: string;
  location: string;
  sellerId: mongoose.Types.ObjectId;
  images: string[];
  documents: string[];
  videos?: string[];
  features: string[];
  views: number;
  status: "active" | "pending" | "sold" | "removed";
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema: Schema<IListing> = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    condition: { type: String, enum: ["new", "used", "reconditioned"], required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    mileage: { type: Number, required: true },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "cng", "hybrid", "electric", "octane"],
      required: true,
    },
    transmission: {
      type: String,
      enum: ["manual", "automatic", "semi-automatic"],
      required: true,
    },
    engineSize: { type: Number, required: true },
    color: { type: String, required: true },
    location: { type: String, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    images: [{ type: String }],
    documents: [{ type: String }],
    videos: [{ type: String }],
    features: [{ type: String }],
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "pending", "sold", "removed"],
      default: "pending",
    },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Listing: Model<IListing> =
  mongoose.models.Listing || mongoose.model<IListing>("Listing", ListingSchema);
