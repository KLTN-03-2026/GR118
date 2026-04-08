export const ACTIONS = {
  // 🔹 Common actions
  READ_ALL: "read_all",
  READ_ONE: "read_one",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  ENABLE_AND_DISABLE: "enable_and_disable",

  // 🔹 Resource & Action
  READ_RESOURCES: "read_resources",
  READ_ACTIONS: "read_actions",

  // 🔹 Authentication
  LOGOUT: "logout",
  REVOKE_TOKEN: "revoke_token",


  // 🔹 User / Admin
  ASSIGN_ROLE: "assign_role",
  READ_ALL_USERS: "read_all_users",
  READ_ONE_USER: "read_one_user",
  LOCK_USER: "lock_user",

  // 🔹 Auth (me)
  ME: "me",

  // 🔹 File
  UPLOAD_FILE: "Upload_File",
} as const;