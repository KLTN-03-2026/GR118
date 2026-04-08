import mongoose, { Schema, Document } from "mongoose";

export interface IVolunteerRegistration extends Document {
  activity_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  full_name: string;
  phone: string;
  note?: string;
  registration_status: string;
  registered_at: Date;
  cancelled_at?: Date;
}

const SchemaReg = new Schema<IVolunteerRegistration>({
  activity_id: { type: Schema.Types.ObjectId, ref: "VolunteerActivity" },
  user_id: { type: Schema.Types.ObjectId, ref: "Auth" },

  full_name: String,
  phone: String,
  note: String,

  registration_status: String,

  registered_at: { type: Date, default: Date.now },
  cancelled_at: Date,
});

SchemaReg.index({ activity_id: 1, user_id: 1 }, { unique: true });

export const VolunteerRegistrationModel = mongoose.model(
  "VolunteerRegistration",
  SchemaReg
);