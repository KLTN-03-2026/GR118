import mongoose, { Document, Model } from "mongoose";

const DOC_NAME = "Otp";
const COLLECTION_NAME = "otps";

export interface IOtp extends Document {
  email: string;
  code: string;
  type: "register" | "reset" | "login";
  expiresAt: Date;
  used: boolean;
}

const otpSchema = new mongoose.Schema<IOtp>({
  email: { type: String, required: true, lowercase: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ["register", "reset", "login"],
    required: true,
  },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: COLLECTION_NAME,
});

// Tự động xóa OTP hết hạn
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const otpModel: Model<IOtp> = mongoose.model<IOtp>(DOC_NAME, otpSchema);

export default otpModel;
