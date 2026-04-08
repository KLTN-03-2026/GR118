import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({

    resource_id: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true,
        unique: true
    }

}, { timestamps: true });

export default mongoose.model("Resource", resourceSchema);