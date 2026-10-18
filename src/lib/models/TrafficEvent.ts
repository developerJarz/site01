import mongoose, { Schema } from "mongoose";

const TrafficEventSchema = new Schema({
  key: { type: String, required: true, unique: true },
  visitor: { type: String, required: true },
  kind: { type: String, enum: ["page_view", "impression", "click"], required: true },
  path: { type: String, required: true },
  listingId: { type: Schema.Types.ObjectId, ref: "Listing" },
  sellerId: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
TrafficEventSchema.index({ sellerId: 1, createdAt: -1, kind: 1 });
TrafficEventSchema.index({ createdAt: -1, kind: 1 });
TrafficEventSchema.index({ listingId: 1, createdAt: -1 });
TrafficEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 });

export const TrafficEventModel = mongoose.models.TrafficEvent || mongoose.model("TrafficEvent", TrafficEventSchema);
