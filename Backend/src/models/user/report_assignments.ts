import mongoose, { Schema, Document } from "mongoose";

export interface IReportAssignment extends Document {
  report_id: mongoose.Types.ObjectId;
  assignee_id: mongoose.Types.ObjectId;
  assigned_by: mongoose.Types.ObjectId;
  assigned_at: Date;
  note?: string;
}

const SchemaAssign = new Schema<IReportAssignment>({
  report_id: { type: Schema.Types.ObjectId, ref: "Report" },

  assignee_id: { type: Schema.Types.ObjectId, ref: "Auth" },
  assigned_by: { type: Schema.Types.ObjectId, ref: "Auth" },

  assigned_at: { type: Date, default: Date.now },
  note: String,
});

export const ReportAssignmentModel = mongoose.model(
  "ReportAssignment",
  SchemaAssign
);