import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({

    action_id: {
        type: String,
        required: true,
        unique: true
    },

    resource_id: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    }

}, { timestamps: true });

export default mongoose.model("Action", actionSchema);