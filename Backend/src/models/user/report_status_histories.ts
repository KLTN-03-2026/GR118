import mongoose, { Schema, Document } from "mongoose";

export interface IReportStatusHistory extends Document {
  report_id: mongoose.Types.ObjectId;
  from_status?: string;
  to_status: string;
  changed_by?: mongoose.Types.ObjectId | null;
  note?: string;
  created_at: Date;
}

const SchemaStatus = new Schema<IReportStatusHistory>({
  report_id: { type: Schema.Types.ObjectId, ref: "Report", index: true },

  from_status: String,
  to_status: String,

  changed_by: { type: Schema.Types.ObjectId, ref: "Auth", default: null },

  note: String,

  created_at: { type: Date, default: Date.now },
});

export const ReportStatusHistoryModel = mongoose.model(
  "ReportStatusHistory",
  SchemaStatus
);