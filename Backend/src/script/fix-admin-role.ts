import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoleScheme from '../models/auth/user_role';
import * as userRepo from '../repos/auth/user.repos';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thaibbc-issue';
const ADMIN_USER_ID = '69d71105430b3ce760c04445';
const ADMIN_ROLE_ID = 'role_admin';

async function fixAdminRole() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('Checking for existing role link...');
    const existing = await userRoleScheme.findOne({ user_id: ADMIN_USER_ID, role_id: ADMIN_ROLE_ID });
    
    if (!existing) {
      console.log('Linking ADMIN user to admin role...');
      await userRoleScheme.create({
        user_id: ADMIN_USER_ID,
        role_id: ADMIN_ROLE_ID,
        ur_id: new mongoose.Types.ObjectId().toString()
      });
      console.log('Role link created.');
    } else {
      console.log('Role link already exists.');
    }

    console.log('Syncing data to auths table...');
    await userRepo.syncUserPrimaryRole(ADMIN_USER_ID);
    
    console.log('Done! User ADMIN should now have role: admin');
    process.exit(0);
  } catch (error) {
    console.error('Failed to fix admin role:', error);
    process.exit(1);
  }
}

fixAdminRole();
