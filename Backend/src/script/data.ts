import mongoose from "mongoose";
import resourceSchema from "../models/auth/resources";
import actionSchema from "../models/auth/actions";
import permissionSchema from "../models/auth/permissions";
import rolePermissionSchema from "../models/auth/role_permissions";

async function seed() {

  console.log("Mongo connected1111111");
     await mongoose.connect("mongodb+srv://ndviet1501_db_user:LcBjSLWejTnbwyqq@cluster0.ddmnzgn.mongodb.net/?appName=Cluster0");
  // resources
  // const resources = [
  //   { resource_id: 1, name: "auth" },
  //   { resource_id: 2, name: "role" },
  //   { resource_id: 3, name: "permission" },
  //   { resource_id: 4, name: "user" },
  //   { resource_id: 5, name: "admin-user" },
  // ];

  // await resourceSchema.insertMany(resources);

  // console.log("Resources inserted");

  // const actions = [

  //   { action_id: 11, resource_id: 1, name: "logout" },
  //   { action_id: 12, resource_id: 1, name: "me" },

  //   { action_id: 21, resource_id: 2, name: "read_all" },
  //   { action_id: 22, resource_id: 2, name: "read_one" },
  //   { action_id: 23, resource_id: 2, name: "create" },
  //   { action_id: 24, resource_id: 2, name: "update" },
  //   { action_id: 25, resource_id: 2, name: "delete" },
  //   { action_id: 26, resource_id: 2, name: "enable_and_disable" },

  //   { action_id: 31, resource_id: 3, name: "read_all" },
  //   { action_id: 32, resource_id: 3, name: "read_one" },
  //   { action_id: 33, resource_id: 3, name: "create" },
  //   { action_id: 34, resource_id: 3, name: "update" },
  //   { action_id: 35, resource_id: 3, name: "delete" },
  //   { action_id: 36, resource_id: 3, name: "read_resources" },
  //   { action_id: 37, resource_id: 3, name: "read_actions" },

  //   { action_id: 41, resource_id: 4, name: "read_one" },
  //   { action_id: 42, resource_id: 4, name: "update" },

  //   { action_id: 51, resource_id: 5, name: "assign_role" },
  //   { action_id: 52, resource_id: 5, name: "read_all" },
  //   { action_id: 53, resource_id: 5, name: "read_one" },
  //   { action_id: 54, resource_id: 5, name: "lock_user" },
  //   { action_id: 55, resource_id: 5, name: "update" },
  // ];

  // await actionSchema.insertMany(actions);

  // console.log("Actions inserted");
  var roleID ="69c65570cfc5670b9f4153aa"
  const rolePerm =[
      {rp_id: 1, role_id:roleID , perm_id: 1},
  ]

  await rolePermissionSchema.insertMany(rolePerm);

  process.exit();
}

seed();

// npx ts-node src/script/data.ts