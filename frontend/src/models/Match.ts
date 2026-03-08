import mongoose, { Schema, type InferSchemaType } from "mongoose";

const matchReasonSchema = new Schema(
  {
    label: { type: String, required: true },
    matched: { type: Boolean, required: true },
    detail: { type: String, default: "" },
  },
  { _id: false }
);

const matchSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    reasons: { type: [matchReasonSchema], default: [] },
    sharedTags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "contacted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

matchSchema.index({ listingId: 1, score: -1 });
matchSchema.index({ tenantId: 1, score: -1 });
matchSchema.index({ listingId: 1, tenantId: 1 }, { unique: true });

export type IMatch = InferSchemaType<typeof matchSchema>;

export const Match =
  mongoose.models.Match ?? mongoose.model("Match", matchSchema);
