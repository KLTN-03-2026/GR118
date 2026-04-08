import mongoose, { Schema, Document } from "mongoose";

export interface IReportComment extends Document {
  report_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  content: string;
  created_at: Date;
  updated_at: Date;
}

const SchemaComment = new Schema<IReportComment>(
  {
    report_id: { type: Schema.Types.ObjectId, ref: "Report" },
    user_id: { type: Schema.Types.ObjectId, ref: "Auth" },
    content: String,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const ReportCommentModel = mongoose.model(
  "ReportComment",
  SchemaComment
);