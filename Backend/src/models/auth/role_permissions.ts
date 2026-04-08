import mongoose from "mongoose";

const rolePermissionSchema = new mongoose.Schema({

    rp_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },

    role_id: {
        type: String,
        required: true
    },

    perm_id: {
        type: String,
        required: true
    },

    assign_at: {
        type: Date,
        default: Date.now
    }

});

rolePermissionSchema.index({ role_id: 1, perm_id: 1 }, { unique: true });

export default mongoose.model("RolePermission", rolePermissionSchema);