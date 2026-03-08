import mongoose, { Schema, type InferSchemaType } from "mongoose";

const poiAffinitySchema = new Schema(
  {
    category: {
      type: String,
      enum: [
        "restaurants",
        "bars",
        "cafes",
        "grocery",
        "gyms",
        "parks",
        "transit",
      ],
      required: true,
    },
    weight: { type: Number, min: 0, max: 1, required: true },
    source: { type: String },
  },
  { _id: false }
);

const envPrefSchema = new Schema(
  {
    trait: { type: String, required: true },
    weight: { type: Number, min: 0, max: 1, required: true },
    source: { type: String },
  },
  { _id: false }
);

const dealbreakerSchema = new Schema(
  {
    trait: { type: String, required: true },
    source: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    auth0Id: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["tenant", "host"], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    university: { type: String, default: "" },
    company: { type: String, default: "" },
    lifestyleTags: { type: [String], default: [] },

    // Tenant-specific
    preferences: {
      city: { type: String },
      term: { type: String },
      budgetMax: { type: Number },
    },

    // Host-specific
    responseTime: { type: String, default: "" },

    // Free-text field from "Anything else we need to know?"
    freeText: { type: String, default: "" },

    // LLM-parsed preferences from freeText
    parsedPreferences: {
      processedAt: { type: Date },
      poiAffinities: { type: [poiAffinitySchema], default: [] },
      environmentPreferences: { type: [envPrefSchema], default: [] },
      imagePreferences: { type: [envPrefSchema], default: [] },
      dealbreakers: { type: [dealbreakerSchema], default: [] },
      rawSummary: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ "preferences.city": 1, "preferences.term": 1 });

export type IUser = InferSchemaType<typeof userSchema>;

export const User =
  mongoose.models.User ?? mongoose.model("User", userSchema);
