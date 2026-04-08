import mongoose from "mongoose";

const userRoleScheme = new mongoose.Schema({
    ur_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    user_id: {
        type: String,
        required: true,
        index: true
    },
    role_id: {
        type: String,
        required: true,
        index: true
    },
    assign_at: {
        type: Date,
        default: Date.now
    }
});

userRoleScheme.index({ user_id: 1, role_id: 1 }, { unique: true });

export default mongoose.model("UserRole", userRoleScheme);