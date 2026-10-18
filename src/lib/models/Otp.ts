import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otpCode: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OtpSchema: Schema<IOtp> = new Schema(
  {
    email: { type: String, required: true },
    otpCode: { type: String, required: true },
    // Checked explicitly on use; the TTL index only tidies up afterwards.
    expiresAt: { type: Date, required: true, expires: "5m" },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
