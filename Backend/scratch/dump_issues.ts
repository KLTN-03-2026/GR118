import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Issue from "../src/models/issue.model";

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "";

async function dump() {
  try {
    await mongoose.connect(MONGO_URI);
    const issues = await Issue.find({}).lean();
    console.log(JSON.stringify(issues, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

dump();
