import mongoose, { Schema, Document } from "mongoose";

export interface MediaFile {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

export interface Verification {
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  message: string;
  evidence?: string[];
  createdAt: Date;
  adminReviewed?: boolean;
  adminNote?: string;
}

export interface SpamReport {
  userId: string;
  userName: string;
  userAvatar?: string;
  reason: "fake" | "spam" | "inappropriate" | "duplicate" | "other";
  reasonText?: string;
  createdAt: Date;
  moderatorReviewed?: boolean;
  moderatorNote?: string;
}

export interface AIAnalysis {
  isAuthentic: boolean;
  confidenceScore: number;
  reasons: string[];
  tags: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface ProcessingStep {
  action: "received" | "assigned" | "processing" | "need_info" | "resolved" | "rejected";
  note: string;
  actorId: string;
  actorName: string;
  createdAt: Date;
  assignedTo?: string;
  evidence?: string[];
}

export interface IIssue extends Document {
  title: string;
  description: string;
  category: "road" | "garbage" | "lighting" | "flood" | "noise" | "other";
  status: "pending" | "received" | "processing" | "need_info" | "resolved" | "rejected";
  location: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  imageUrl: string;
  mediaFiles?: MediaFile[];
  reporterName: string;
  reporterId: string;
  reportedAt: Date;
  updatedAt: Date;
  votes: number;
  comments: number;
  verifications?: Verification[];
  spamReports?: SpamReport[];
  aiConfidence?: number;
  aiLabel?: string;
  aiVerified?: boolean;
  aiScore?: number;
  aiAnalysis?: AIAnalysis;
  moderatorId?: string;
  moderatorName?: string;
  assignedTo?: string;
  assignedAt?: Date;
  receivedAt?: Date;
  processingNote?: string;
  completionNote?: string;
  completionEvidence?: string[];
  processingHistory?: ProcessingStep[];
}

const MediaFileSchema = new Schema<MediaFile>({
  type: { type: String, enum: ["image", "video"], required: true },
  url: { type: String, required: true },
  thumbnail: { type: String }
});

const VerificationSchema = new Schema<Verification>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  evidence: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  adminReviewed: { type: Boolean },
  adminNote: { type: String }
});

const SpamReportSchema = new Schema<SpamReport>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  reason: { type: String, enum: ["fake", "spam", "inappropriate", "duplicate", "other"], required: true },
  reasonText: { type: String },
  createdAt: { type: Date, default: Date.now },
  moderatorReviewed: { type: Boolean },
  moderatorNote: { type: String }
});

const AIAnalysisSchema = new Schema<AIAnalysis>({
  isAuthentic: { type: Boolean, required: true },
  confidenceScore: { type: Number, required: true },
  reasons: [{ type: String }],
  tags: [{ type: String }],
  severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true }
});

const ProcessingStepSchema = new Schema<ProcessingStep>({
  action: { type: String, enum: ["received", "assigned", "processing", "need_info", "resolved", "rejected"], required: true },
  note: { type: String, required: true },
  actorId: { type: String, required: true },
  actorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  assignedTo: { type: String },
  evidence: [{ type: String }]
});

const IssueSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ["road", "garbage", "lighting", "flood", "noise", "other"], required: true },
  status: { type: String, enum: ["pending", "received", "processing", "need_info", "resolved", "rejected"], default: "pending" },
  location: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  imageUrl: { type: String },
  mediaFiles: [MediaFileSchema],
  reporterName: { type: String, required: true },
  reporterId: { type: String, required: true },
  reportedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  votes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  verifications: [VerificationSchema],
  spamReports: [SpamReportSchema],
  aiConfidence: { type: Number },
  aiLabel: { type: String },
  aiVerified: { type: Boolean, default: false },
  aiScore: { type: Number },
  aiAnalysis: AIAnalysisSchema,
  moderatorId: { type: String },
  moderatorName: { type: String },
  assignedTo: { type: String },
  assignedAt: { type: Date },
  receivedAt: { type: Date },
  processingNote: { type: String },
  completionNote: { type: String },
  completionEvidence: [{ type: String }],
  processingHistory: [ProcessingStepSchema]
}, { timestamps: true });

export default mongoose.model<IIssue>("Issue", IssueSchema);
