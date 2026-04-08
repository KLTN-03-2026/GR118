import mongoose, { Schema, Document } from "mongoose";

export interface IReportMedia extends Document {
  report_id: mongoose.Types.ObjectId;
  media_type: "image" | "video";
  file_url: string;
  file_size?: number;
  mime_type?: string;
  sort_order?: number;
  created_at: Date;
}

const ReportMediaSchema = new Schema<IReportMedia>({
  report_id: { type: Schema.Types.ObjectId, ref: "Report", index: true },

  media_type: { type: String, enum: ["image", "video"] },

  file_url: { type: String, required: true },

  file_size: Number,
  mime_type: String,
  sort_order: Number,

  created_at: { type: Date, default: Date.now },
});

export const ReportMediaModel = mongoose.model<IReportMedia>(
  "ReportMedia",
  ReportMediaSchema
);