import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  whatsappSameAsPhone?: boolean;
  allowPhoneDisplay: boolean;
  allowWhatsApp: boolean;
  password?: string;
  avatar?: string;
  avatarPublicId?: string;
  /** A customer role (guest, buyer, seller, dealer) or a team role key (admin, moderator, custom…). */
  role: string;
  status: "active" | "suspended";
  suspendedReason?: string;
  suspendedAt?: Date;
  adminNotes?: string;
  lastLoginAt?: Date;
  loginCount?: number;
  /** Per-person admin preferences, e.g. which dashboard widgets they see. */
  adminPrefs?: { dashboard?: { order?: string[]; hidden?: string[] } };
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
    phone: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    whatsappSameAsPhone: { type: Boolean },
    allowPhoneDisplay: { type: Boolean, default: true },
    allowWhatsApp: { type: Boolean, default: true },
    password: { type: String },
    avatar: { type: String },
    avatarPublicId: { type: String, select: false },
    // Validated against customer roles and the team roles in lib/staff-roles by the APIs that set it.
    role: { type: String, default: "buyer", trim: true, maxlength: 32 },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    suspendedReason: { type: String, default: "", maxlength: 300 },
    suspendedAt: { type: Date },
    adminNotes: { type: String, default: "", maxlength: 2000, select: false },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    adminPrefs: { type: Schema.Types.Mixed, select: false },
    isVerified: { type: Boolean, default: false },
    bio: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    dealershipName: { type: String, default: "" },
    dealershipLicense: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

