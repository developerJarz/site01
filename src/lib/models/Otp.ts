import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otpCode: string;
  expiresAt: Date;
}

const OtpSchema: Schema<IOtp> = new Schema(
  {
    email: { type: String, required: true },
    otpCode: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: "5m" }, // Automatically delete after 5 minutes
  },
  { timestamps: true }
);

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);

