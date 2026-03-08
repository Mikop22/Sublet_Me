import mongoose, { Schema, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "tour-proposal", "tour-confirmed"],
      default: "text",
    },
    tourSlots: { type: [Date], default: [] },
    selectedSlot: { type: Date },
    meetLink: { type: String },
  },
  { timestamps: true }
);

const conversationSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
    unreadByHost: { type: Number, default: 0 },
    unreadByTenant: { type: Number, default: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ hostId: 1, lastMessageAt: -1 });
conversationSchema.index({ tenantId: 1, lastMessageAt: -1 });
conversationSchema.index(
  { listingId: 1, tenantId: 1 },
  { unique: true }
);

export type IConversation = InferSchemaType<typeof conversationSchema>;

export const Conversation =
  mongoose.models.Conversation ??
  mongoose.model("Conversation", conversationSchema);
