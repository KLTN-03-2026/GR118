import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authSchema from '../models/auth.model';
import * as userRepo from '../repos/auth/user.repos';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thaibbc-issue';

async function syncAllUserRoles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const users = await authSchema.find({});
    console.log(`Found ${users.length} users to sync.`);

    for (const user of users) {
      console.log(`Syncing role for user: ${user.userName}...`);
      await userRepo.syncUserPrimaryRole(user._id.toString());
    }

    console.log('Sync completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

syncAllUserRoles();
