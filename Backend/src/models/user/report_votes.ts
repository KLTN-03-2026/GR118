import mongoose, { Schema, Document } from "mongoose";

export interface IReportVote extends Document {
  report_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  vote_type: boolean; // true for upvote, false for downvote
  created_at: Date;
}

const SchemaVote = new Schema<IReportVote>({
  report_id: { type: Schema.Types.ObjectId, ref: "Report" },
  user_id: { type: Schema.Types.ObjectId, ref: "Auth" },

  vote_type: { type: Boolean },

  created_at: { type: Date, default: Date.now },
});

SchemaVote.index({ report_id: 1, user_id: 1 }, { unique: true });

export const ReportVoteModel = mongoose.model("ReportVote", SchemaVote);