import mongoose, { Schema, Document } from "mongoose";

export interface IReportRating extends Document {
  report_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  star_score: number;
  ai_valid_status?: string;
  ai_reason?: string;
  created_at: Date;
}

const SchemaRating = new Schema<IReportRating>({
  report_id: { type: Schema.Types.ObjectId, ref: "Report" },
  user_id: { type: Schema.Types.ObjectId, ref: "Auth" },

  star_score: { type: Number, min: 1, max: 5 },

  ai_valid_status: String,
  ai_reason: String,

  created_at: { type: Date, default: Date.now },
});

SchemaRating.index({ report_id: 1, user_id: 1 }, { unique: true });

export const ReportRatingModel = mongoose.model(
  "ReportRating",
  SchemaRating
);