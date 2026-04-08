import mongoose from "mongoose";

const permissionActionSchema = new mongoose.Schema({

    pa_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },

    perm_id: {
        type: String,
        required: true
    },

    action_id: {
        type: String,
        required: true
    },

    assign_at: {
        type: Date,
        default: Date.now
    }

});

permissionActionSchema.index({ perm_id: 1, action_id: 1 }, { unique: true });

export default mongoose.model("PermissionAction", permissionActionSchema);