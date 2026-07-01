import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  package: "Free" | "Standard" | "Premium" | "Dealer";
  expiryDate: Date;
  status: "active" | "expired" | "cancelled";
  createdAt: Date;
}

const SubscriptionSchema: Schema<ISubscription> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    package: {
      type: String,
      enum: ["Free", "Standard", "Premium", "Dealer"],
      default: "Free",
    },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
