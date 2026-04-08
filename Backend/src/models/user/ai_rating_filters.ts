import mongoose, { Schema, Document } from "mongoose";

const SchemaAIRating = new Schema({
  rating_id: { type: Schema.Types.ObjectId, ref: "ReportRating" },

  ai_result: String,
  reason: String,

  created_at: { type: Date, default: Date.now },
});

export const AIRatingFilterModel = mongoose.model(
  "AIRatingFilter",
  SchemaAIRating
);