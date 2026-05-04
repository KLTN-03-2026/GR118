import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Issue from "../src/models/issue.model";

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "";

async function cleanup() {
  try {
    if (!MONGO_URI) {
        throw new Error("MONGO_URI not found in .env");
    }
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const issues = await Issue.find({});
    console.log(`Found ${issues.length} issues to check`);
    
    for (const issue of issues) {
      if (issue.verifications && issue.verifications.length > 1) {
        const seenUsers = new Set();
        const uniqueVerifications = [];
        let changed = false;

        // Keep the latest one by reversing or just keep the first one
        // User wants to delete 2 out of 3, so keeping the first one is fine.
        for (const v of issue.verifications) {
          if (!seenUsers.has(v.userId)) {
            seenUsers.add(v.userId);
            uniqueVerifications.push(v);
          } else {
            changed = true;
          }
        }

        if (changed) {
          const removedCount = issue.verifications.length - uniqueVerifications.length;
          issue.verifications = uniqueVerifications;
          // Also update the comments count if it was incremented per verification
          // In addVerification we had $inc: { comments: 1 }
          if (issue.comments !== undefined) {
              issue.comments = Math.max(0, issue.comments - removedCount);
          }
          
          await issue.save();
          console.log(`Cleaned ${removedCount} duplicates for issue: ${issue.title}`);
        }
      }
    }

    console.log("Cleanup finished");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
}

cleanup();
