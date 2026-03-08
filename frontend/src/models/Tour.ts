import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tourSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    proposedSlots: { type: [Date], default: [] },
    selectedSlot: { type: Date },
    meetLink: { type: String, default: "" },
    status: {
      type: String,
      enum: ["proposed", "confirmed", "completed", "cancelled"],
      default: "proposed",
    },
  },
  { timestamps: true }
);

tourSchema.index({ hostId: 1, status: 1 });
tourSchema.index({ tenantId: 1, status: 1 });

export type ITour = InferSchemaType<typeof tourSchema>;

export const Tour =
  mongoose.models.Tour ?? mongoose.model("Tour", tourSchema);
