import mongoose, { Schema, Document } from "mongoose";


const SchemaAIReview = new Schema({
  report_id: { type: Schema.Types.ObjectId, ref: "Report" },
  model_version: String,
  ai_model_name: String,
  ai_predicted_category: String,
  confidence_score: Number,

  content_check_result: String,
  image_check_result: String,

  final_decision: String,

  created_at: { type: Date, default: Date.now },
});

export const AIReportReviewModel = mongoose.model(
  "AIReportReview",
  SchemaAIReview
);