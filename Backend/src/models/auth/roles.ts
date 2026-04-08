import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    role_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()  
    },

    name: {
        type: String,
        required: true,
        unique: true
    },

    description: String,

    is_root: {
        type: Boolean,
        default: false
    },

    is_active: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

export default mongoose.model("Role", roleSchema);