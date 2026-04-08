import mongoose, { Schema, Document } from "mongoose";

export interface IVolunteerActivity extends Document {
  title: string;
  content?: string;
  start_time: Date;
  end_time: Date;
  location_text?: string;
  max_participants?: number;
  registration_status: "open" | "closed";
  status?: string;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const SchemaActivity = new Schema<IVolunteerActivity>(
  {
    title: String,
    content: String,

    start_time: Date,
    end_time: Date,

    location_text: String,
    max_participants: Number,

    registration_status: { type: String, enum: ["open", "closed"] },

    status: String,

    created_by: { type: Schema.Types.ObjectId, ref: "Auth" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const VolunteerActivityModel = mongoose.model(
  "VolunteerActivity",
  SchemaActivity
);