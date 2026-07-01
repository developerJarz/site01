import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  buyerUnread: number;
  sellerUnread: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    buyerUnread: { type: Number, default: 0 },
    sellerUnread: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure one conversation per buyer + seller + listing
ConversationSchema.index({ buyer: 1, seller: 1, listing: 1 }, { unique: true });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
