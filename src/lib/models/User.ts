import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  allowPhoneDisplay: boolean;
  allowWhatsApp: boolean;
  password?: string;
  avatar?: string;
  role: "guest" | "buyer" | "seller" | "dealer" | "admin";
  isVerified: boolean;
  bio?: string;
  address?: string;
  city?: string;
  dealershipName?: string;
  dealershipLicense?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: "+880" },
    whatsappNumber: { type: String, default: "+880" },
    allowPhoneDisplay: { type: Boolean, default: true },
    allowWhatsApp: { type: Boolean, default: true },
    password: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["guest", "buyer", "seller", "dealer", "admin"],
      default: "buyer",
    },
    isVerified: { type: Boolean, default: false },
    bio: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    dealershipName: { type: String, default: "" },
    dealershipLicense: { type: String, default: "" },
  },
  { timestamps: true }
);

// Force recompile during development hot-reloads
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
