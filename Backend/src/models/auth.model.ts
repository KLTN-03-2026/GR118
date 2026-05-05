import mongoose, { Document, Model } from "mongoose";

const DOC_NAME = "Auth";
const COLLECTION_NAME = "auths";

export interface IAuth extends Document {
    userName: string;
    name: string;
    password: string;
    email: string;
    avatar?: string | null;
    phone?: string | null;
    city?: string | null;
    refreshToken?: string | null;
    types: "login" | "login-google";
    lockEnd?: Date | null;
    lockReason?: string | null;
    role?: string | null;
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
    name: {
        type: String,
        required: true
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
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    city: {
        type: String,
        default: null
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
    },
    role: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

const authModel: Model<IAuth> = mongoose.model<IAuth>(DOC_NAME, authSchema);

export default authModel;