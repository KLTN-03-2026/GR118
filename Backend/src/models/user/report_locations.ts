import mongoose, { Schema, Document } from "mongoose";

export interface IReportLocation extends Document {
  report_id: mongoose.Types.ObjectId;
  address_text?: string;

  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };

  ward?: string;
  district?: string;
  city?: string;
}

const ReportLocationSchema = new Schema<IReportLocation>({
  report_id: {
    type: Schema.Types.ObjectId,
    ref: "Report",
    unique: true,
  },

  address_text: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },

  ward: String,
  district: String,
  city: String,
});

ReportLocationSchema.index({ location: "2dsphere" });

export const ReportLocationModel = mongoose.model(
  "ReportLocation",
  ReportLocationSchema
);