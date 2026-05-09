import mongoose, { Schema, Document } from "mongoose";

export interface Participant {
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  userCity?: string;
  userAvatar?: string;
  note?: string;
  registeredAt: Date;
  status: "registered" | "cancelled" | "attended" | "absent";
  cancelledAt?: Date;
}

export interface IActivity extends Document {
  title: string;
  description: string;
  content: string;
  location: string;
  district: string;
  ward: string;
  city: string;
  lat: number;
  lng: number;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  imageUrl: string;
  creatorId: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  registrationOpen: boolean;
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "hidden";
  tags?: string[];
  participants?: Participant[];
}

const ParticipantSchema = new Schema<Participant>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  userEmail: { type: String },
  userCity: { type: String },
  userAvatar: { type: String },
  note: { type: String },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["registered", "cancelled", "attended", "absent"], default: "registered" },
  cancelledAt: { type: Date }
});

const ActivitySchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  location: { type: String, required: true },
  district: { type: String, required: true },
  ward: { type: String, required: true },
  city: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  maxParticipants: { type: Number, required: true },
  currentParticipants: { type: Number, default: 0 },
  imageUrl: { type: String, required: true },
  creatorId: { type: String, required: true },
  creatorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  registrationOpen: { type: Boolean, default: true },
  status: { type: String, enum: ["upcoming", "ongoing", "completed", "cancelled", "hidden"], default: "upcoming" },
  tags: [{ type: String }],
  participants: [ParticipantSchema]
}, { timestamps: true });

export default mongoose.model<IActivity>("Activity", ActivitySchema);
