import mongoose, { Schema } from "mongoose";

/** One thing a team member did in the admin area. Kept for a year, then removed automatically. */
const ActivityLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User" },
  actorName: { type: String, default: "" },
  actorEmail: { type: String, default: "" },
  actorRole: { type: String, default: "" },
  /** Dotted key such as "listing.update"; the first part is the area. */
  action: { type: String, required: true },
  area: { type: String, required: true },
  /** Plain-English sentence shown in the log, e.g. "Approved 3 listings". */
  summary: { type: String, required: true, maxlength: 500 },
  targetId: { type: String, default: "" },
  targetLabel: { type: String, default: "", maxlength: 200 },
  details: { type: Schema.Types.Mixed },
  ip: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
ActivityLogSchema.index({ area: 1, createdAt: -1 });
ActivityLogSchema.index({ actorId: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 86400 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
