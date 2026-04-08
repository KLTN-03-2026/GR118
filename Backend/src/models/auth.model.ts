import mongoose, { Document, Model } from "mongoose";

const DOC_NAME = "Auth";
const COLLECTION_NAME = "auths";

export interface IAuth extends Document {
    userName: string;
    password: string;
    email: string;
    refreshToken?: string | null;
    types: "login" | "login-google";
    lockEnd?: Date | null;
    lockReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const authSchema = new mongoose.Schema<IAuth>({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    refreshToken: {
        type: String,
        default: null
    },
    types: {
        type: String,
        enum: ["login", "login-google"],
        default: "login"
    },
    lockEnd: {
        type: Date,
        default: null
    },
    lockReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

const authModel: Model<IAuth> = mongoose.model<IAuth>(DOC_NAME, authSchema);

export default authModel;