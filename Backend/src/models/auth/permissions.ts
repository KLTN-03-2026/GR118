import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({

    perm_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },

    resource_id: {
        type: String,
        required: true
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
    }

}, { timestamps: true });

export default mongoose.model("Permission", permissionSchema);