import mongoose, { Schema, Model } from "mongoose";

/**
 * A team role and its permissions. Built-in roles (moderator, editor, support) only get a document
 * once an admin edits them; until then the defaults in lib/permissions apply. "admin" is never stored.
 */
export interface IStaffRole {
  key: string;
  name: string;
  description: string;
  permissions: string[];
  builtIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffRoleSchema = new Schema<IStaffRole>(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 32 },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    permissions: { type: [String], default: [] },
    builtIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const StaffRole: Model<IStaffRole> =
  mongoose.models.StaffRole || mongoose.model<IStaffRole>("StaffRole", StaffRoleSchema);
