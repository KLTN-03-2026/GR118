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
      let changed = false;

      // Reconcile comment count
      const actualCommentCount = issue.commentsList?.length || 0;
      if (issue.comments !== actualCommentCount) {
        console.log(`Reconciling comments for ${issue.title}: ${issue.comments} -> ${actualCommentCount}`);
        issue.comments = actualCommentCount;
        changed = true;
      }

      // Cleanup duplicate verifications
      if (issue.verifications && issue.verifications.length > 1) {
        const seenUsers = new Set();
        const uniqueVerifications = [];
        let verifChanged = false;

        for (const v of issue.verifications) {
          if (!seenUsers.has(v.userId)) {
            seenUsers.add(v.userId);
            uniqueVerifications.push(v);
          } else {
            verifChanged = true;
          }
        }

        if (verifChanged) {
          const removedCount = issue.verifications.length - uniqueVerifications.length;
          issue.verifications = uniqueVerifications;
          changed = true;
          console.log(`Cleaned ${removedCount} duplicate verifications for issue: ${issue.title}`);
        }
      }

      if (changed) {
        await issue.save();
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
