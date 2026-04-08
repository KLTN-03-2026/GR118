import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  report_code: string;
  creator_id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  severity_level: string;
  category_id?: mongoose.Types.ObjectId | null;
  status: string;
  visibility_status: "public" | "private";
  approved_by_ai?: boolean;
  ai_reject_reason?: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    report_code: { type: String, required: true, unique: true },

    creator_id: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String },

    severity_level: {
      type: String,
      enum: ["low", "medium", "high"]
    },

    category_id: {
      type: Schema.Types.ObjectId,
      ref: "ReportCategory",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "resolved", "rejected"],
      index: true
    },

    visibility_status: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    is_deleted: { type: Boolean, default: false },
    approved_by_ai: Boolean,
    ai_reject_reason: String,
  },

  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
ReportSchema.index({ creator_id: 1 });
ReportSchema.index({ category_id: 1 });
ReportSchema.index({ created_at: -1 });
export const ReportModel = mongoose.model<IReport>("Report", ReportSchema);