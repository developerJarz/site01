import mongoose, { Schema, Model } from "mongoose";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/contact-request";

export interface IContactMessage {
  name: string;
  email: string;
  phone?: string;
  topic: ContactTopic;
  message: string;
  /** Slug of the car a report is about, when sent from a listing. */
  listing?: string;
  status: "new" | "open" | "resolved";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, maxlength: 254 },
    phone: { type: String, maxlength: 30 },
    topic: { type: String, enum: CONTACT_TOPICS, default: "general" },
    message: { type: String, required: true, maxlength: 4000 },
    listing: { type: String, maxlength: 200 },
    status: { type: String, enum: ["new", "open", "resolved"], default: "new" },
    note: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ status: 1, createdAt: -1 });

export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage || mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
