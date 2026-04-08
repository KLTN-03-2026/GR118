import mongoose, { Schema, Document } from "mongoose";

export interface IReportSupplementRequest extends Document {
  report_id: mongoose.Types.ObjectId;
  requested_by: mongoose.Types.ObjectId;
  content: string;
  status: string;
  created_at: Date;
}

const ReportSupplementRequestSchema = new Schema<IReportSupplementRequest>({
  report_id: {
    type: Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true,
  },

  requested_by: {
    type: Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },

  content: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"], // bạn có thể chỉnh lại theo business
    default: "pending",
    index: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const ReportSupplementRequestModel = mongoose.model<IReportSupplementRequest>(
  "ReportSupplementRequest",
  ReportSupplementRequestSchema
);